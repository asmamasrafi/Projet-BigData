import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import static org.apache.spark.sql.functions.*;

public class BatchAnalysis {

    public static void main(String[] args) {

        // 1. Spark session
        SparkSession spark = SparkSession.builder()
                .appName("Cybersecurity Batch Analysis")
                .master("local[*]")
                .getOrCreate();

        // 2. Lire le fichier depuis HDFS
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv("hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv");

        // 3. Filtrer suspicious + malicious
        Dataset<Row> filtered = df.filter(
                col("threat_label").isin("suspicious", "malicious")
        );

        // 4. Calcul Top 10 IP sources
        Dataset<Row> topIPs = filtered.groupBy("source_ip")
                .agg(count("*").alias("total_attacks"))
                .orderBy(desc("total_attacks"))
                .limit(10);

        // 5. Affichage résultat
        System.out.println("===== TOP 10 MALICIOUS IP SOURCES =====");
        topIPs.show(false);

        spark.stop();
    }
}