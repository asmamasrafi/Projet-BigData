import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

/**
 * Analyse 3 — Patterns d'attaques dans request_path
 * Détecte : SQL Injection, XSS, Path Traversal
 */
public class AttackPathAnalysis {

    // Patterns d'attaques
    private static final String SQLI_PATTERN =
            "(?i)(union\\s+select|or\\s+1=1|drop\\s+table|insert\\s+into|select\\s+\\*|delete\\s+from|--)";

    private static final String XSS_PATTERN =
            "(?i)(<script|javascript:|onerror=|onload=|alert\\(|%3Cscript%3E)";

    private static final String PATH_TRAVERSAL_PATTERN =
            "(?i)(\\.\\.[\\\\/]|%2e%2e|/etc/passwd|/windows/system32)";

    public static void run(SparkSession spark, String hdfsPath) {

        System.out.println("===== ANALYSE 3 : PATTERNS D'ATTAQUES SQLi/XSS =====");

        // 1. Lire et nettoyer
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv(hdfsPath)
                .filter(col("request_path").isNotNull());

        // 2. Classifier chaque requête
        Dataset<Row> classified = df.withColumn("attack_type",
                when(col("request_path").rlike(SQLI_PATTERN), "SQL_INJECTION")
                .when(col("request_path").rlike(XSS_PATTERN), "XSS")
                .when(col("request_path").rlike(PATH_TRAVERSAL_PATTERN), "PATH_TRAVERSAL")
                .otherwise(null)
        ).filter(col("attack_type").isNotNull());

        // 3. Grouper par type + IP
        Dataset<Row> attackPatterns = classified
                .groupBy("attack_type", "source_ip")
                .agg(
                        count("*").alias("nb_occurrences"),
                        min("timestamp").alias("premiere_attaque"),
                        max("timestamp").alias("derniere_attaque"),
                        first("request_path").alias("exemple_path")
                )
                .orderBy(desc("nb_occurrences"));

        // 4. Affichage détail
        System.out.println("\n📊 Patterns d'attaques détectés :");
        attackPatterns.select(
                col("attack_type"),
                col("source_ip"),
                col("nb_occurrences"),
                col("exemple_path"),
                col("premiere_attaque"),
                col("derniere_attaque")
        ).show(20, false);

        // 5. Statistiques globales
        System.out.println("\n📈 Résumé par type d'attaque :");
        attackPatterns.groupBy("attack_type")
                .agg(
                        countDistinct("source_ip").alias("nb_ips_attaquantes"),
                        sum("nb_occurrences").alias("total_occurrences")
                )
                .orderBy(desc("total_occurrences"))
                .show(false);

        // 6. Sauvegarde HDFS
        attackPatterns.write()
                .mode(SaveMode.Overwrite)
                .parquet("hdfs://namenode:9000/batch_results/attack_patterns");

        System.out.println("✅ Résultats sauvegardés → hdfs:///batch_results/attack_patterns");
    }
}
