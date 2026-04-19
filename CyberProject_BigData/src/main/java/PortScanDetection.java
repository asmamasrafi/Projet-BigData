import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

public class PortScanDetection {

    public static void main(String[] args) {

        SparkSession spark = SparkSession.builder()
                .appName("Port Scan Detection")
                .master("local[*]")
                .getOrCreate();

        // 1. LIRE DATASET HDFS
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv("hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv");

        // 2. PARSING TIMESTAMP
        Dataset<Row> parsed = df.withColumn(
                "timestamp",
                to_timestamp(col("timestamp"))
        );

        // 3. CLEAN DATA
        Dataset<Row> clean = parsed
                .filter(col("timestamp").isNotNull());

        // 4. TCP ONLY
        Dataset<Row> tcp = clean
                .filter(col("protocol").equalTo("TCP"));

        // 5. WINDOW 5 MIN + COUNT DISTINCT DEST
        Dataset<Row> grouped = tcp
                .groupBy(
                        col("source_ip"),
                        window(col("timestamp"), "5 minutes")
                )
                .agg(
                        countDistinct("dest_ip").alias("unique_dest_ips")
                );

        // 6. DETECTION FINAL
        Dataset<Row> scans = grouped
                .filter(col("unique_dest_ips").gt(5))
                .orderBy(desc("unique_dest_ips"));

        // 🔥 UNIQUE AFFICHAGE FINAL
        System.out.println("===== PORT SCAN DETECTION =====");
        scans.show(false);

        spark.stop();
    }
}