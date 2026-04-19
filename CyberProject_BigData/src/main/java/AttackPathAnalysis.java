import org.apache.spark.sql.*;
import static org.apache.spark.sql.functions.*;

public class AttackPathAnalysis {

    public static void main(String[] args) {

        SparkSession spark = SparkSession.builder()
                .appName("Attack Path Analysis")
                .master("local[*]")
                .getOrCreate();

        // =========================
        // 1. LOAD DATA
        // =========================
        Dataset<Row> df = spark.read()
                .option("header", "true")
                .option("inferSchema", "true")
                .csv("hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv");

        // =========================
        // 2. CLEAN DATA
        // =========================
        Dataset<Row> clean = df.filter(col("request_path").isNotNull());

        // =========================
        // 3. XSS DETECTION (EN PREMIER)
        // =========================
        Dataset<Row> xss = clean.filter(
                col("request_path").rlike("(?i)(<script|javascript:|onerror=|onload=|%3Cscript%3E)")
        ).withColumn("attack_type", lit("XSS"));

        // =========================
        // 4. SQL INJECTION DETECTION (APRES)
        // =========================
        Dataset<Row> sqlInjection = clean.filter(
                col("request_path").rlike("(?i)(union\\s+select|drop\\s+table|or\\s+1=1|--|insert\\s+into|select\\s+\\*|delete\\s+from)")
        ).withColumn("attack_type", lit("SQL_INJECTION"));

        // =========================
        // 5. UNION (AVEC TON LOGIQUE)
        // =========================
        Dataset<Row> attacks = sqlInjection;

        if (xss.count() > 0) {
            attacks = xss.union(sqlInjection); // XSS en premier
        }

        // =========================
        // 6. AFFICHAGE
        // =========================
        System.out.println("===== ATTACK PATH ANALYSIS =====");

        attacks.select(
                col("source_ip"),
                col("request_path"),
                col("attack_type")
        ).show(false);

        // =========================
        // 7. STATISTIQUES
        // =========================
        System.out.println("===== ATTACK TYPE STATISTICS =====");

        attacks.groupBy("attack_type")
                .count()
                .orderBy(desc("count"))
                .show(false);

        // =========================
        // 8. STOP SPARK
        // =========================
        spark.stop();
    }
}