# ============================================================
#  cyber_batch.py — Analyses Spark Batch
#  À soumettre avec : spark-submit cyber_batch.py
# ============================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import *

# ── Initialisation Spark ────────────────────────────────────
spark = SparkSession.builder \
    .appName("CyberSecurity-Batch-Analysis") \
    .master("spark://spark-master:7077") \
    .config("spark.jars", "/opt/spark-jobs/hbase-spark.jar") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

HDFS_PATH = "hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv"

print("\n" + "="*60)
print("   CHARGEMENT DES DONNÉES DEPUIS HDFS")
print("="*60)

# ── Chargement du CSV ───────────────────────────────────────
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .csv(HDFS_PATH)

# Cast des colonnes importantes
df = df.withColumn("timestamp", F.to_timestamp("timestamp", "yyyy-MM-dd HH:mm:ss")) \
       .withColumn("bytes_transferred", F.col("bytes_transferred").cast(LongType()))

df.cache()
total = df.count()
print(f"\n✅ Dataset chargé : {total:,} lignes")
df.printSchema()

# ════════════════════════════════════════════════════════════
# ANALYSE 1 — Top 10 IPs sources malveillantes
# ════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("   ANALYSE 1 : Top 10 IPs Malveillantes")
print("="*60)

top10_ips = df.filter(
        F.col("threat_label").isin("suspicious", "malicious")
    ) \
    .groupBy("source_ip") \
    .agg(
        F.count("*").alias("nb_connexions"),
        F.sum(F.when(F.col("threat_label") == "malicious", 1).otherwise(0)).alias("nb_malicious"),
        F.sum(F.when(F.col("threat_label") == "suspicious", 1).otherwise(0)).alias("nb_suspicious"),
        F.sum("bytes_transferred").alias("total_bytes"),
        F.countDistinct("dest_ip").alias("nb_cibles"),
        F.collect_set("protocol").alias("protocoles")
    ) \
    .withColumn(
        # Score de réputation : malicious pèse plus que suspicious
        "reputation_score",
        F.round(
            (F.col("nb_malicious") * 2.0 + F.col("nb_suspicious") * 1.0) / F.col("nb_connexions") * 100,
            2
        )
    ) \
    .orderBy(F.col("reputation_score").desc()) \
    .limit(10)

print("\n📊 Top 10 IPs les plus dangereuses :")
top10_ips.show(truncate=False)

# Sauvegarde temporaire pour HBase (étape suivante)
top10_ips.write.mode("overwrite").parquet(
    "hdfs://namenode:9000/batch_results/ip_reputation"
)
print("✅ Résultats sauvegardés → hdfs:///batch_results/ip_reputation")

# ════════════════════════════════════════════════════════════
# ANALYSE 2 — Détection de scans de ports
# Inspiré du Java : compter dest_ip distincts sur fenêtre 5 min
# ════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("   ANALYSE 2 : Détection de Scans de Ports (TCP < 5 min)")
print("="*60)

port_scans = df.filter(F.col("protocol") == "TCP") \
    .groupBy(
        F.col("source_ip"),
        F.window(F.col("timestamp"), "5 minutes")
    ) \
    .agg(
        F.countDistinct("dest_ip").alias("unique_dest_ips"),
        F.count("*").alias("nb_tentatives"),
        F.min("timestamp").alias("premiere_tentative"),
        F.max("timestamp").alias("derniere_tentative")
    ) \
    .filter(F.col("unique_dest_ips") > 5) \
    .orderBy(F.col("unique_dest_ips").desc())

print("\n📊 IPs suspectes de scan de ports :")
port_scans.show(20, truncate=False)

port_scans.write.mode("overwrite").parquet(
    "hdfs://namenode:9000/batch_results/port_scans"
)
print("✅ Résultats sauvegardés → hdfs:///batch_results/port_scans")

# ════════════════════════════════════════════════════════════
# ANALYSE 3 — Patterns SQLi / XSS dans request_path
# ════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("   ANALYSE 3 : Patterns SQLi / XSS")
print("="*60)

# Patterns d'attaques connus
SQLI_PATTERN = r"(?i)(union\s+select|or\s+'1'='1|drop\s+table|insert\s+into|'\s+or\s+|--\s*$|;\s*select|xp_cmdshell)"
XSS_PATTERN  = r"(?i)(<script|javascript:|onerror=|onload=|alert\(|<img[^>]+src|eval\(|document\.cookie)"
PATH_TRAV    = r"(\.\./|\.\.\\|%2e%2e|etc/passwd|etc/shadow)"

attack_patterns = df.filter(F.col("request_path").isNotNull()) \
    .withColumn("is_sqli",     F.col("request_path").rlike(SQLI_PATTERN).cast(IntegerType())) \
    .withColumn("is_xss",      F.col("request_path").rlike(XSS_PATTERN).cast(IntegerType())) \
    .withColumn("is_path_trav",F.col("request_path").rlike(PATH_TRAV).cast(IntegerType())) \
    .withColumn("attack_type",
        F.when(F.col("request_path").rlike(SQLI_PATTERN), "SQLi")
         .when(F.col("request_path").rlike(XSS_PATTERN),  "XSS")
         .when(F.col("request_path").rlike(PATH_TRAV),    "PathTraversal")
         .otherwise("benign")
    ) \
    .filter(F.col("attack_type") != "benign") \
    .groupBy("attack_type", "source_ip") \
    .agg(
        F.count("*").alias("nb_occurrences"),
        F.collect_list("request_path").alias("exemples_paths"),
        F.min("timestamp").alias("premiere_attaque"),
        F.max("timestamp").alias("derniere_attaque")
    ) \
    .withColumn("exemples_paths", F.slice("exemples_paths", 1, 3)) \
    .orderBy(F.col("nb_occurrences").desc())

print("\n📊 Patterns d'attaques détectés :")
attack_patterns.show(20, truncate=False)

# Stats globales
print("\n📈 Résumé par type d'attaque :")
attack_patterns.groupBy("attack_type") \
    .agg(
        F.count("source_ip").alias("nb_ips_attaquantes"),
        F.sum("nb_occurrences").alias("total_occurrences")
    ) \
    .show()

attack_patterns.write.mode("overwrite").parquet(
    "hdfs://namenode:9000/batch_results/attack_patterns"
)
print("✅ Résultats sauvegardés → hdfs:///batch_results/attack_patterns")

# ════════════════════════════════════════════════════════════
# ANALYSE 4 — Volume bytes_transferred par type de menace
# Inspiré du Java : 6 types d'attaques classifiés
# ════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("   ANALYSE 4 : Volume de Données par Type de Menace")
print("="*60)

# Classification en 6 types comme dans AttackVolumeAnalysis.java
classified = df.withColumn("attack_type",
    F.when(F.col("request_path").rlike(r"(?i)(union\s+select|or\s+1=1|--|drop|insert|delete|update)"),
        "SQL_INJECTION")
    .when(F.col("request_path").rlike(r"(?i)(\.\./|%2e%2e|/etc/passwd|/windows/system32)"),
        "PATH_TRAVERSAL")
    .when(F.col("request_path").rlike(r"(?i)(<script|javascript:|onerror=|onload=|alert\()"),
        "XSS")
    .when(F.col("request_path").contains("/login") & (F.col("action") == "blocked"),
        "BRUTE_FORCE")
    .when(F.col("request_path").rlike(r"(?i)(;|\||&&|`|\$\(|cat /|ls |whoami|rm -rf)"),
        "COMMAND_INJECTION")
    .when(F.col("bytes_transferred") > 40000,
        "DDOS")
    .otherwise("NORMAL")
)

# Corrélation bytes ↔ attack_type
volume_result = classified.groupBy("attack_type") \
    .agg(
        F.count("*").alias("nb_evenements"),
        F.sum("bytes_transferred").alias("total_bytes"),
        F.round(F.avg("bytes_transferred"), 2).alias("avg_bytes"),
        F.min("bytes_transferred").alias("min_bytes"),
        F.max("bytes_transferred").alias("max_bytes")
    ) \
    .orderBy(F.col("total_bytes").desc())

print("\n📊 Volume de données par type d'attaque :")
volume_result.show(truncate=False)

# Évolution temporelle par threat_label
threat_timeline = df.withColumn("date", F.to_date("timestamp")) \
    .withColumn("heure", F.hour("timestamp")) \
    .groupBy("date", "heure", "threat_label") \
    .agg(
        F.count("*").alias("nb_evenements"),
        F.sum("bytes_transferred").alias("total_bytes"),
        F.round(F.avg("bytes_transferred"), 2).alias("avg_bytes"),
        F.max("bytes_transferred").alias("max_bytes"),
        F.countDistinct("source_ip").alias("nb_ips_uniques")
    ) \
    .orderBy("date", "heure", "threat_label")

print("\n📈 Évolution temporelle des menaces :")
threat_timeline.show(30, truncate=False)

threat_timeline.write.mode("overwrite").parquet(
    "hdfs://namenode:9000/batch_results/threat_timeline"
)
print("✅ Résultats sauvegardés → hdfs:///batch_results/threat_timeline")

# ── Fin ─────────────────────────────────────────────────────
print("\n" + "="*60)
print("   ✅ TOUTES LES ANALYSES TERMINÉES")
print("="*60)
print("\n📌 Résultats dans HDFS :")
print("   hdfs:///batch_results/ip_reputation")
print("   hdfs:///batch_results/port_scans")
print("   hdfs:///batch_results/attack_patterns")
print("   hdfs:///batch_results/threat_timeline")
print("\n📌 Prochaine étape : Écriture dans HBase")
print("   → bash run_hbase.sh\n")

spark.stop()
