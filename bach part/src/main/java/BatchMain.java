import org.apache.spark.sql.SparkSession;

/**
 * Classe principale — orchestre toutes les analyses batch
 * Cybersecurity Threat Detection — Lambda Architecture
 */
public class BatchMain {

    public static final String HDFS_PATH =
        "hdfs://namenode:9000/logs/year=2023/month=10/day=15/cybersecurity_threat_detection_logs.csv";

    public static void main(String[] args) {

        System.out.println("================================================");
        System.out.println("   CYBERSECURITY BATCH ANALYSIS — START        ");
        System.out.println("================================================");

        // ── Initialisation SparkSession ─────────────────────
        SparkSession spark = SparkSession.builder()
                .appName("Cybersecurity-Batch-Analysis")
                .master("spark://spark-master:7077")
                .getOrCreate();

        spark.sparkContext().setLogLevel("WARN");

        try {

            // ── Analyse 1 : Top 10 IPs malveillantes ───────
            System.out.println("\n[1/4] Lancement : Top 10 IPs Malveillantes...");
            BatchAnalysis.run(spark, HDFS_PATH);

            // ── Analyse 2 : Détection scans de ports ───────
            System.out.println("\n[2/4] Lancement : Détection Scans de Ports...");
            PortScanDetection.run(spark, HDFS_PATH);

            // ── Analyse 3 : Patterns SQLi / XSS ────────────
            System.out.println("\n[3/4] Lancement : Patterns d'Attaques...");
            AttackPathAnalysis.run(spark, HDFS_PATH);

            // ── Analyse 4 : Volume par type de menace ───────
            System.out.println("\n[4/4] Lancement : Volume par Type de Menace...");
            AttackVolumeAnalysis.run(spark, HDFS_PATH);

            // ── Écriture dans HBase ─────────────────────────
            System.out.println("\n[5/5] Lancement : Écriture dans HBase...");
            HBaseWriter.run(spark, "hbase", "2181");

            System.out.println("\n================================================");
            System.out.println("   ✅ TOUTES LES ANALYSES TERMINÉES            ");
            System.out.println("================================================");

        } catch (Exception e) {
            System.err.println("❌ Erreur : " + e.getMessage());
            e.printStackTrace();
        } finally {
            spark.stop();
        }
    }
}
