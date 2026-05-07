import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

/**
 * Analyse 4 — Volume de données par type de menace
 * Classification en 6 catégories + évolution temporelle
 */
public class AttackVolumeAnalysis {

    public static void run(SparkSession spark, String hdfsPath) {

        System.out.println("===== ANALYSE 4 : VOLUME PAR TYPE DE MENACE =====");

        // 1. Lire le dataset
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv(hdfsPath);

        // 2. Classifier en 6 types d'attaques
        Dataset<Row> classified = df.withColumn("attack_type",
                when(col("request_path").rlike(
                        "(?i)(union\\s+select|or\\s+1=1|--|drop|insert|delete|update)"),
                        "SQL_INJECTION")
                .when(col("request_path").rlike(
                        "(?i)(\\.\\.[\\\\/]|%2e%2e|/etc/passwd|/windows/system32)"),
                        "PATH_TRAVERSAL")
                .when(col("request_path").rlike(
                        "(?i)(<script|javascript:|onerror=|onload=|alert\\()"),
                        "XSS")
                .when(col("request_path").contains("/login")
                        .and(col("action").equalTo("blocked")),
                        "BRUTE_FORCE")
                .when(col("request_path").rlike(
                        "(?i)(;|\\||&&|`|\\$\\(|cat /|ls |whoami|rm -rf)"),
                        "COMMAND_INJECTION")
                .when(col("bytes_transferred").gt(40000),
                        "DDOS")
                .otherwise("NORMAL")
        );

        // 3. Corrélation bytes_transferred ↔ attack_type
        Dataset<Row> volumeResult = classified.groupBy("attack_type")
                .agg(
                        count("*").alias("nb_evenements"),
                        sum("bytes_transferred").alias("total_bytes"),
                        round(avg("bytes_transferred"), 2).alias("avg_bytes"),
                        min("bytes_transferred").alias("min_bytes"),
                        max("bytes_transferred").alias("max_bytes")
                )
                .orderBy(desc("total_bytes"));

        System.out.println("\n📊 Volume de données par type d'attaque :");
        volumeResult.show(false);

        // 4. Évolution temporelle par heure
        Dataset<Row> timeline = df
                .withColumn("timestamp", to_timestamp(col("timestamp")))
                .withColumn("date", to_date(col("timestamp")))
                .withColumn("heure", hour(col("timestamp")))
                .groupBy("date", "heure", "threat_label")
                .agg(
                        count("*").alias("nb_evenements"),
                        sum("bytes_transferred").alias("total_bytes"),
                        round(avg("bytes_transferred"), 2).alias("avg_bytes"),
                        max("bytes_transferred").alias("max_bytes"),
                        countDistinct("source_ip").alias("nb_ips_uniques")
                )
                .orderBy("date", "heure", "threat_label");

        System.out.println("\n📈 Évolution temporelle des menaces :");
        timeline.show(30, false);

        // 5. Sauvegarde HDFS
        timeline.write()
                .mode(SaveMode.Overwrite)
                .parquet("hdfs://namenode:9000/batch_results/threat_timeline");

        System.out.println("✅ Résultats sauvegardés → hdfs:///batch_results/threat_timeline");
    }
}
