import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import static org.apache.spark.sql.functions.*;

public class AttackVolumeAnalysis {

    public static void main(String[] args) {

        // Spark Session
        SparkSession spark = SparkSession.builder()
                .appName("Attack Volume Analysis")
                .master("local[*]")
                .getOrCreate();

        // Lecture dataset
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv("hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv");

        // Classification des attaques
        Dataset<Row> classified = df.withColumn("attack_type",
                when(col("request_path").rlike("(?i)(union\\s+select|or\\s+1=1|--|drop|insert|delete|update)"),
                        "SQL_INJECTION")

                .when(col("request_path").rlike("(?i)(\\../|%2e%2e|/etc/passwd|/windows/system32)"),
                        "PATH_TRAVERSAL")

                .when(col("request_path").rlike("(?i)(<script|javascript:|onerror=|onload=|alert\\()"),
                        "XSS")

                .when(col("request_path").contains("/login")
                        .and(col("action").equalTo("blocked")),
                        "BRUTE_FORCE")

                .when(col("request_path").rlike("(?i)(;|\\||&&|`|\\$\\(|cat /|ls |whoami|rm -rf)"),
                        "COMMAND_INJECTION")

                .when(col("bytes_transferred").gt(40000),
                        "DDOS")

                .otherwise("NORMAL")
        );

        // ===== ANALYSE PRINCIPALE (réponse au sujet) =====
        Dataset<Row> result = classified.groupBy("attack_type")
                .agg(
                        count("*").alias("number_of_events"),
                        sum("bytes_transferred").alias("total_bytes"),
                        avg("bytes_transferred").alias("avg_bytes_transferred"),
                        min("bytes_transferred").alias("min_bytes"),
                        max("bytes_transferred").alias("max_bytes")
                )
                .orderBy(desc("total_bytes"));

        System.out.println("===== VOLUME DE DONNÉES PAR TYPE D'ATTAQUE (CORRÉLATION bytes_transferred) =====");
        result.show(false);

        spark.stop();
    }
}