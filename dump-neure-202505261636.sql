-- MySQL dump 10.13  Distrib 8.4.4, for macos15 (x86_64)
--
-- Host: staging-database.c1yjwhlkzg3c.ap-south-1.rds.amazonaws.com    Database: neure
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `performed_by` varchar(50) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_module_name` (`module_name`),
  KEY `idx_action` (`action`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_module_action_time` (`module_name`,`action`,`created_at`),
  KEY `idx_company_id` (`company_id`),
  CONSTRAINT `fk_activity_logs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (81,4,23,'Chandan Yadav','workshops','complete','Workshop \"Test \" (ID: 32) for company \"TheFruit\" (ID: 23) held on 5/12/2025, 4:00:00 AM was marked as completed','2025-05-13 10:01:49'),(82,4,NULL,'Chandan Yadav','companies','delete','Company \"Test123\" (ID: 43) and all associated data permanently deleted','2025-05-14 08:13:32'),(84,4,NULL,'Chandan Yadav','companies','delete','Company \"Test123\" (ID: 44) and all associated data permanently deleted','2025-05-14 11:30:25'),(85,4,NULL,'Chandan Yadav','companies','delete','Company \"Bitroot\" (ID: 3) and all associated data permanently deleted','2025-05-15 06:26:41'),(87,4,NULL,'Chandan Yadav','workshops','update','Workshop \"Workshop by neure\" (ID: 33) updated. Fields changed: title, description, agenda','2025-05-15 08:12:46'),(89,4,23,'Chandan Yadav','workshops','reschedule','Workshop \"Prioritizing Mental Health in the Workplace\" (ID: 29) for company \"TheFruit\" (ID: 23) rescheduled from 5/12/2025, 5:00:00 AM-5/12/2025, 3:00:00 PM to 5/15/2025, 2:00:00 PM-5/15/2025, 6:00:00 PM','2025-05-15 08:14:32'),(100,4,NULL,'Chandan Yadav','companies','delete','Company \"Tech Solutions\" (ID: 6) and all associated data permanently deleted','2025-05-16 09:31:58'),(101,4,NULL,'Chandan Yadav','companies','delete','Company \"AgroGrow\" (ID: 4) and all associated data permanently deleted','2025-05-16 09:32:10'),(105,4,23,'Chandan Yadav','workshops','reschedule','Workshop \"Unleash your superhero\" (ID: 20) for company \"TheFruit\" (ID: 23) rescheduled from 5/12/2025, 6:00:00 PM-5/12/2025, 8:00:00 PM to 5/16/2025, 3:28:32 PM-5/16/2025, 9:00:00 PM','2025-05-16 09:58:56'),(109,4,NULL,'Chandan Yadav','workshops','update','Workshop \"Workshop by Bitroot\" (ID: 33) updated. Fields changed: title, description, agenda','2025-05-16 11:45:56'),(118,4,50,'Chandan Yadav','companies','create','Company \"Fitnova\" created. Contact person: Veer Malhotra (c2905y@gmail.com)','2025-05-22 09:43:20'),(119,4,50,'Chandan Yadav','workshops','schedule','Workshop \"Workshop by Bitroot\" (ID: 33) scheduled for company \"Fitnova\" (ID: 50) on 5/22/2025, 6:00:00 PM','2025-05-22 11:54:20'),(120,4,50,'Chandan Yadav','workshops','complete','Workshop \"Workshop by Bitroot\" (ID: 33) for company \"Fitnova\" (ID: 50) held on 5/22/2025, 6:00:00 PM was marked as completed','2025-05-22 12:06:47'),(121,4,NULL,'Chandan Yadav','companies','deactivation_rejected','Deactivation request for company \"Fitnova\" was rejected','2025-05-23 06:31:23'),(122,4,50,'Chandan Yadav','workshops','schedule','Workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" (ID: 36) scheduled for company \"Fitnova\" (ID: 50) on 5/23/2025, 4:00:00 PM','2025-05-23 07:15:17'),(124,4,51,'Chandan Yadav','companies','create','Company \"TestForTemplate\" created. Contact person: john colen (abcd@gmail.com)','2025-05-23 10:54:39'),(125,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" (ID: 36) scheduled for company \"TestForTemplate\" (ID: 51) on 5/23/2025, 4:32:11 PM','2025-05-23 11:02:18'),(126,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Workshop by Bitroot\" (ID: 33) scheduled for company \"TestForTemplate\" (ID: 51) on 5/23/2025, 4:35:18 PM','2025-05-23 11:05:22'),(127,4,NULL,'Chandan Yadav','companies','delete','Company \"FinEdge\" (ID: 5) and all associated data permanently deleted','2025-05-26 04:59:42'),(128,4,NULL,'Chandan Yadav','companies','delete','Company \"HealthifyMe\" (ID: 2) and all associated data permanently deleted','2025-05-26 04:59:52'),(129,4,NULL,'Chandan Yadav','companies','delete','Company \"Tata Housing Private Limited\" (ID: 1) and all associated data permanently deleted','2025-05-26 05:00:32'),(130,4,NULL,'Chandan Yadav','companies','delete','Company \"SolarTech\" (ID: 35) and all associated data permanently deleted','2025-05-26 05:00:53'),(131,4,NULL,'Chandan Yadav','companies','delete','Company \"Bitroot\" (ID: 45) and all associated data permanently deleted','2025-05-26 05:01:04'),(132,4,NULL,'Chandan Yadav','companies','delete','Company \"Technova\" (ID: 25) and all associated data permanently deleted','2025-05-26 05:01:19'),(133,4,NULL,'Chandan Yadav','companies','delete','Company \"Technova\" (ID: 46) and all associated data permanently deleted','2025-05-26 05:01:32'),(134,4,NULL,'Chandan Yadav','companies','delete','Company \"Test123\" (ID: 47) and all associated data permanently deleted','2025-05-26 05:01:45'),(135,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" (ID: 36) scheduled for company \"TestForTemplate\" (ID: 51) on 5/26/2025, 11:10:32 AM','2025-05-26 05:40:40'),(136,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Workshop by Bitroot\" (ID: 33) scheduled for company \"TestForTemplate\" (ID: 51) on 5/26/2025, 11:25:43 AM','2025-05-26 05:55:49'),(137,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" (ID: 36) scheduled for company \"TestForTemplate\" (ID: 51) on 5/26/2025, 2:29:14 PM','2025-05-26 08:59:20'),(138,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Workshop by Bitroot\" (ID: 33) scheduled for company \"TestForTemplate\" (ID: 51) on 5/26/2025, 2:31:04 PM','2025-05-26 09:01:08'),(139,4,51,'Chandan Yadav','workshops','schedule','Workshop \"Workshop by Bitroot\" (ID: 33) scheduled for company \"TestForTemplate\" (ID: 51) on 5/26/2025, 2:34:30 PM','2025-05-26 09:04:35');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_company`
--

DROP TABLE IF EXISTS `announcement_company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_company` (
  `announcement_id` int NOT NULL,
  `company_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`announcement_id`,`company_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `announcement_company_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_company_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_company`
--

LOCK TABLES `announcement_company` WRITE;
/*!40000 ALTER TABLE `announcement_company` DISABLE KEYS */;
INSERT INTO `announcement_company` VALUES (54,50,1,'2025-05-23 07:02:02','2025-05-23 07:02:02'),(55,50,1,'2025-05-23 07:02:29','2025-05-23 07:02:29');
/*!40000 ALTER TABLE `announcement_company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_reads`
--

DROP TABLE IF EXISTS `announcement_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_announcement_user` (`announcement_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_announcement_id` (`announcement_id`),
  KEY `idx_company_id` (`company_id`),
  CONSTRAINT `announcement_reads_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_reads_ibfk_3` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_reads`
--

LOCK TABLES `announcement_reads` WRITE;
/*!40000 ALTER TABLE `announcement_reads` DISABLE KEYS */;
INSERT INTO `announcement_reads` VALUES (107,51,204,50,'2025-05-23 07:00:52'),(109,52,213,50,'2025-05-23 07:01:23'),(111,52,204,50,'2025-05-23 07:02:05'),(113,53,213,50,'2025-05-23 07:02:09'),(115,54,204,50,'2025-05-23 07:02:35'),(117,55,204,50,'2025-05-23 07:02:41'),(119,55,213,50,'2025-05-23 07:09:11');
/*!40000 ALTER TABLE `announcement_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `content` text,
  `link` varchar(255) DEFAULT NULL,
  `audience_type` enum('company','employees','all','company_employees') NOT NULL DEFAULT 'all',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (51,'ds','dcs',NULL,'all','2025-05-23 07:00:45',0),(52,'ewd','dwc',NULL,'all','2025-05-23 07:01:17',0),(53,'ewcd','cdcd',NULL,'employees','2025-05-23 07:01:39',0),(54,'wddsc','cddsc',NULL,'company','2025-05-23 07:02:02',0),(55,'cds','cd',NULL,'company_employees','2025-05-23 07:02:29',0);
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reading_time` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `image_url` varchar(2083) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES (31,'The Impact of Sleep on Mental Health','Lack of sleep doesn’t just leave you feeling tired—it can have significant consequences for mental health. Research shows that chronic sleep deprivation is linked to increased anxiety, depression, and even cognitive decline. When we sleep, our brain processes emotions, consolidates memories, and clears out toxins. Poor sleep disrupts these processes, leading to mood swings and difficulty coping with stress.\n\n To improve sleep quality, create a bedtime routine that includes reducing screen time before bed, maintaining a consistent sleep schedule, and practicing relaxation techniques like deep breathing or meditation. A good night’s sleep isn’t a luxury—it’s essential for a healthy mind. If you struggle with persistent insomnia, consulting a professional may help.',5,'2025-04-02 10:25:15','2025-04-02 10:26:38','Mental Health','[\"sleep\", \"mental health\", \"well-being\"]','https://images.pexels.com/photos/4101155/pexels-photo-4101155.jpeg?auto=compress&cs=tinysrgb&w=1200'),(32,'How to Build Resilience in Challenging Times','Resilience is our ability to bounce back from adversity. It’s not something people are born with but rather a skill that can be developed over time. Resilient individuals tend to have strong problem-solving abilities, maintain a positive outlook, and seek social support when facing challenges.\n\n To build resilience, start by reframing setbacks as opportunities for growth. Practicing mindfulness and self-care also helps reduce stress, making it easier to handle difficult situations. Developing strong relationships with friends, family, or mentors can provide a support system to lean on when times get tough. Remember, resilience isn’t about avoiding hardship but rather learning how to thrive despite it.',6,'2025-04-02 10:25:15','2025-04-02 10:28:17','Self-Development','[\"resilience\", \"mindset\", \"growth\"]','https://images.pexels.com/photos/9644814/pexels-photo-9644814.jpeg?auto=compress&cs=tinysrgb&w=1200'),(33,'The Science Behind Meditation and Stress Reduction','Meditation has been practiced for centuries, but modern science is now proving its benefits. Studies show that regular meditation reduces cortisol levels—the hormone responsible for stress—and improves emotional well-being. By focusing on breath and awareness, meditation helps rewire the brain, making it more resilient to stressors.\n\n Incorporating meditation into your daily routine doesn’t have to be complicated. Start with just five minutes of deep breathing or guided meditation each day. Over time, you’ll notice improved focus, reduced anxiety, and a greater sense of inner peace. Whether through mindfulness, transcendental meditation, or simply sitting quietly, taking time to slow down can have lasting benefits for mental health.',7,'2025-04-02 10:25:15','2025-04-02 10:28:17','Wellness','[\"meditation\", \"stress\", \"mindfulness\"]','https://images.pexels.com/photos/6932056/pexels-photo-6932056.jpeg?auto=compress&cs=tinysrgb&w=1200'),(34,'10 Habits for a Happier Life','Happiness isn’t just about luck—it’s about habits. Research has identified several daily practices that contribute to a more fulfilling life. Gratitude, for instance, has been shown to improve mood by shifting focus toward positive experiences. Regular exercise releases endorphins, which naturally boost happiness levels.\n\n Social connections are another key factor. Spending time with loved ones, even virtually, fosters emotional well-being. Practicing kindness, whether through small gestures or volunteering, also enhances happiness. Lastly, taking time for self-care—whether through hobbies, reading, or simply resting—ensures that you remain emotionally balanced. By incorporating these habits into your life, you can cultivate a more joyful existence.',5,'2025-04-02 10:25:15','2025-04-02 10:28:17','Lifestyle','[\"happiness\", \"habits\", \"well-being\"]','https://images.pexels.com/photos/6668920/pexels-photo-6668920.jpeg?auto=compress&cs=tinysrgb&w=1200'),(35,'Understanding Anxiety: Symptoms and Management','Anxiety is a natural response to stress, but when it becomes excessive, it can interfere with daily life. Symptoms of anxiety include excessive worry, restlessness, difficulty concentrating, and even physical symptoms like rapid heartbeat or sweating. While occasional anxiety is normal, chronic anxiety can be debilitating.\n\n Managing anxiety involves a combination of lifestyle changes and coping strategies. Deep breathing exercises, mindfulness, and regular physical activity can help regulate stress levels. Limiting caffeine and alcohol intake may also reduce anxiety symptoms. For those experiencing persistent anxiety, cognitive-behavioral therapy (CBT) has been shown to be highly effective. Seeking professional help when needed is a sign of strength, not weakness.',8,'2025-04-02 10:25:15','2025-04-02 10:28:52','Mental Health','[\"anxiety\", \"coping strategies\", \"self-care\"]','https://images.pexels.com/photos/8428399/pexels-photo-8428399.jpeg?auto=compress&cs=tinysrgb&w=1200'),(36,'The Benefits of Daily Journaling','Journaling is a simple yet powerful tool for mental clarity and self-reflection. Writing down your thoughts and emotions helps in organizing your mind, reducing stress, and identifying patterns in behavior.\n\n To start journaling, dedicate a few minutes each day to write freely. There’s no right or wrong way—just express your thoughts. Some prefer gratitude journaling, where they list things they’re thankful for, while others find value in recording daily experiences. Over time, journaling can provide insights into emotional triggers, personal growth, and goal setting. Whether digital or pen-and-paper, journaling fosters mindfulness and resilience.',4,'2025-04-02 10:25:15','2025-04-02 10:29:20','Productivity','[\"journaling\", \"mental health\", \"self-improvement\"]','https://images.pexels.com/photos/4968714/pexels-photo-4968714.jpeg?auto=compress&cs=tinysrgb&w=1200'),(37,'How Diet Affects Your Mood','Your diet has a profound impact on your mental health. Consuming processed foods high in sugar and unhealthy fats can contribute to mood swings and fatigue, while a balanced diet rich in whole foods, omega-3 fatty acids, and probiotics can improve brain function and mood stability.\n\n Some key foods that support mental health include leafy greens, fatty fish, nuts, and fermented foods. Hydration is also crucial, as dehydration can lead to irritability and cognitive decline. Making small but meaningful dietary changes can have long-term positive effects on both mental and physical well-being.',6,'2025-04-02 10:25:15','2025-04-02 10:30:32','Nutrition','[\"diet\", \"mood\", \"nutrition\"]','https://media.istockphoto.com/id/636181714/photo/new-year-resolutions-fruits-dumbbells-and-centimeter.jpg?b=1&s=612x612&w=0&k=20&c=ZQ1zUU9cvlwfv-n9lJtzboMib5LlKYN5gszldqHx57o='),(38,'Exercise and Mental Health: The Connection','Exercise is one of the most effective natural remedies for stress, anxiety, and depression. Engaging in physical activity releases endorphins, which are chemicals that promote happiness and relaxation.\n\n Activities like running, yoga, and strength training can help regulate mood and improve sleep quality. Even a 30-minute walk can make a significant difference in reducing stress levels. If you’re struggling with motivation, start small and gradually increase your activity. Over time, exercise becomes not just a habit but a key part of mental and emotional well-being.',5,'2025-04-02 10:25:15','2025-04-02 10:30:32','Fitness','[\"exercise\", \"mental health\", \"endorphins\"]','https://images.pexels.com/photos/2035108/pexels-photo-2035108.jpeg?auto=compress&cs=tinysrgb&w=1200'),(39,'Breaking Free from Negative Thought Patterns','Negative thoughts can trap us in cycles of stress and anxiety. One effective way to break free is by practicing cognitive behavioral therapy (CBT) techniques. Identifying negative thought patterns and replacing them with rational, positive alternatives can improve mental resilience.\n\n Another useful approach is mindfulness, which encourages observing thoughts without judgment. Engaging in hobbies, socializing, and setting realistic goals also help shift focus away from negativity. Changing thought patterns takes time, but with practice, it can lead to a healthier and more balanced mindset.',7,'2025-04-02 10:25:15','2025-04-02 10:30:32','Psychology','[\"CBT\", \"negative thinking\", \"self-help\"]','https://images.pexels.com/photos/2035108/pexels-photo-2035108.jpeg?auto=compress&cs=tinysrgb&w=1200'),(40,'The Importance of Work-Life Balance','In a world where work is becoming increasingly demanding, maintaining a healthy work-life balance is more crucial than ever. Without balance, stress levels rise, leading to burnout and mental fatigue.\n\n Setting boundaries, such as having a designated workspace and fixed working hours, can prevent work from encroaching on personal life. Taking regular breaks, engaging in leisure activities, and prioritizing family time contribute to overall well-being. Work-life balance isn’t just about reducing stress; it’s about leading a fulfilling and sustainable life.',6,'2025-04-02 10:25:15','2025-04-02 10:30:32','Career','[\"work-life balance\", \"stress\", \"productivity\"]','https://images.pexels.com/photos/2035108/pexels-photo-2035108.jpeg?auto=compress&cs=tinysrgb&w=1200');
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assessment_interpretation_ranges`
--

DROP TABLE IF EXISTS `assessment_interpretation_ranges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessment_interpretation_ranges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `min_score` float NOT NULL,
  `max_score` float NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_interpretation_assessment` (`assessment_id`),
  CONSTRAINT `fk_interpretation_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessment_interpretation_ranges`
--

LOCK TABLES `assessment_interpretation_ranges` WRITE;
/*!40000 ALTER TABLE `assessment_interpretation_ranges` DISABLE KEYS */;
INSERT INTO `assessment_interpretation_ranges` VALUES (5,28,0,2,'PSI test','2025-05-21 09:30:45'),(6,28,3,6,'PSI test','2025-05-21 09:30:45'),(11,26,0,4,'You are free from stress','2025-05-21 09:54:02'),(12,26,5,8,'You have to consult the therapist','2025-05-21 09:54:02'),(17,29,0,3,'test PSI for new rangeggg','2025-05-21 11:22:04'),(18,29,4,6,'test PSI for new range test PSI for new range hhhh','2025-05-21 11:22:04'),(19,30,0,5,'hello from neure','2025-05-21 11:24:12'),(20,30,6,8,'hello from neure','2025-05-21 11:24:12'),(21,30,9,10,'kucjh ','2025-05-21 11:24:12'),(22,31,0,4,'Excellent psychological balance','2025-05-22 12:39:17'),(23,31,5,8,'Mild concerns — practice stress-reduction techniques','2025-05-22 12:39:17'),(24,31,9,12,'Moderate concerns — consider self-help or coaching','2025-05-22 12:39:17'),(25,31,13,20,'High risk — consider professional psychological guidance','2025-05-22 12:39:17');
/*!40000 ALTER TABLE `assessment_interpretation_ranges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assessments`
--

DROP TABLE IF EXISTS `assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text,
  `frequency_days` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_psi_assessment` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessments`
--

LOCK TABLES `assessments` WRITE;
/*!40000 ALTER TABLE `assessments` DISABLE KEYS */;
INSERT INTO `assessments` VALUES (7,'General Mental Well-Being Assessment','This assessment evaluates your overall mental health and emotional well-being.',30,1,'2025-04-01 11:57:06',0),(8,'Anxiety Level Assessment','This test assesses your anxiety levels and common triggers.',30,1,'2025-04-01 11:58:19',0),(9,'Depression Screening Test','This test assesses signs of depression based on common symptoms.',30,1,'2025-04-01 11:59:17',0),(10,'Stress Management Assessment','This assessment helps understand your stress levels and how you manage them.',30,1,'2025-04-01 11:59:29',0),(11,'Work-Life Balance Assessment','This assessment helps evaluate your balance between work and personal life.',30,0,'2025-04-01 11:59:43',0),(26,'Test with points and range','Test with points and range',NULL,0,'2025-05-21 06:13:00',0),(28,'PSI test','PSI test',NULL,0,'2025-05-21 09:30:44',1),(29,'Test PSI for new range','test PSI for new range',NULL,0,'2025-05-21 11:21:25',1),(30,'hello from neure','hello from neure',NULL,0,'2025-05-21 11:24:12',1),(31,'PSI (Psychological Self-Inventory)','This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.',NULL,1,'2025-05-22 12:39:17',1);
/*!40000 ALTER TABLE `assessments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blacklisted_tokens`
--

DROP TABLE IF EXISTS `blacklisted_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklisted_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `blacklisted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklisted_tokens`
--

LOCK TABLES `blacklisted_tokens` WRITE;
/*!40000 ALTER TABLE `blacklisted_tokens` DISABLE KEYS */;
INSERT INTO `blacklisted_tokens` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(13,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(14,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(15,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(17,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(18,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(19,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(20,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(21,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(22,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(23,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(24,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(25,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(26,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(27,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(28,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(29,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(30,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(31,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(32,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(33,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(34,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(35,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(36,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(37,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(38,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(39,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(40,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(41,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(42,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(43,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(44,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(45,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(46,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(47,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(48,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(49,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(50,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(51,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(52,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(53,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-23 07:02:02'),(54,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',NULL,'2025-05-
INSERT INTO `blacklisted_tokens` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiYWJjZGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Mzk4NjczLCJleHAiOjE3MzY0MTY2NzN9.pTdq79jKaRTw2s729jruTzQo-0ZOXAQTw9viFF6VZf0','2025-01-09 05:51:19','2025-01-09 15:27:53'),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjMxNzQsImV4cCI6MTczNzA0MTE3NH0.8j-1BtgoSyOR6xflOFm_AfE5oY4P-NVY9M8oNfH__98','2025-01-16 10:26:26','2025-01-16 20:56:14'),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjI2OTksImV4cCI6MTczNzA0MDY5OX0.sRdthNKcE6cf10eslPv36_TyXZLJP9-f7kFJXPAs3Uk','2025-01-16 10:28:42','2025-01-16 20:48:19'),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MDEsImV4cCI6MTczNzA0MTQwMX0.gnKR_dPrdmtQTaMGcnLhut0irKNBSKhXtO_xxiEFuHc','2025-01-16 10:30:08','2025-01-16 21:00:01'),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MTUsImV4cCI6MTczNzA0MTQxNX0.5JIAk5tKSmfDl32iUMpzY1Akl2q8lVHwx6Wg9wr13m0','2025-01-16 10:30:27','2025-01-16 21:00:15'),(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MzIsImV4cCI6MTczNzA0MTQzMn0.IOiJTlUsi0-LWOPHgsp27a8ol79yf3KyEGOnh8RLLGw','2025-01-16 10:33:16','2025-01-16 21:00:32'),(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM2MDAsImV4cCI6MTczNzA0MTYwMH0.4Ew5VXkfTKaatNz_frFcwnW9hItLGSB6HcuJlGEs5kk','2025-01-16 10:39:30','2025-01-16 21:03:20'),(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjQwMDIsImV4cCI6MTczNzA0MjAwMn0.fMjtd03c0CMmB28Hqinm0Vx2e6RRutUmIlw4zpph-wA','2025-01-16 10:43:24','2025-01-16 21:10:02'),(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwODgzMTksImV4cCI6MTczNzEwNjMxOX0.58dqQFjhbbyM-K7dcO86kXYANtlo7BSNPm-TERZVEWM','2025-01-17 04:33:33','2025-01-17 15:01:59'),(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwODg0MTgsImV4cCI6MTczNzEwNjQxOH0.Oxu-geHL-iCcfjGrPpSB3Wr2_ECDyS2e_PoDxvidlcM','2025-01-17 08:18:37','2025-01-17 15:03:38'),(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcxMDE5MjMsImV4cCI6MTczNzExOTkyM30.llaUosEm7dQB4_labdbqeftNeFVsmIryPoipc3d5bek','2025-01-17 11:53:15','2025-01-17 18:48:43'),(12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzczNDcxNTMsImV4cCI6MTczNzM2NTE1M30.J939c_hx37EIkt4LnWQUookOQ6zrEPuGxahI4OGs6eY','2025-01-20 07:43:24','2025-01-20 14:55:53'),(13,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc0NTY0OTYsImV4cCI6MTczNzQ3NDQ5Nn0.pi7DA2CdfLwrSLP0LUojJ7PW1_A7ZLH8YEWxF9sVUhc','2025-01-21 10:56:34','2025-01-21 21:18:16'),(14,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc0NTcwMDIsImV4cCI6MTczNzQ3NTAwMn0._Or7cCK-ooYlDduE96w-GGxHiTndnBpv-bNXu6_-0SQ','2025-01-21 10:56:46','2025-01-21 21:26:42'),(15,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1MTk3MzMsImV4cCI6MTczNzUzNzczM30.dEG4kVAfp3L6sy2LLcVmQDd9n_rZqAv6KRZRau0Cr84','2025-01-22 06:03:59','2025-01-22 14:52:13'),(16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1Mjg3OTUsImV4cCI6MTczNzU0Njc5NX0.7pWOllOHgcQC_MyzaEucyP1Qlq7RbsJ_1a0m7qz3zpk','2025-01-22 06:53:56','2025-01-22 17:23:15'),(17,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1MzAyMjQsImV4cCI6MTczNzU0ODIyNH0.kyPYrwUUTCH7QNRrsvgBn5LO2V131201hYzSD9EOJs4','2025-01-22 07:38:51','2025-01-22 17:47:04'),(18,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NTgzMzYsImV4cCI6MTczODY3NjMzNn0.NBM8oNDXbxPPmv_E58F55RY2fZHcauaXiSHnneH2Cw0','2025-02-04 08:41:02','2025-02-04 19:08:56'),(19,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NTg1NzAsImV4cCI6MTczODY3NjU3MH0.k1vZqK_to8Hgl5tV0awE_xWxxEIskePpLJRLZFiQejw','2025-02-04 08:53:22','2025-02-04 19:12:50'),(20,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjAyMDIsImV4cCI6MTczODY3ODIwMn0.yEm7N0OlxXmaK-6Guf2c82ceE41V-jaWw5rz6n-zSwE','2025-02-04 09:10:09','2025-02-04 19:40:02'),(21,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjQ5NDUsImV4cCI6MTczODY4Mjk0NX0.GMtHeDj70uS4rzBZ0NBr7bHl84Y2JuuiPb-mmF9dkc4','2025-02-04 10:29:14','2025-02-04 20:59:05'),(22,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjUwMTYsImV4cCI6MTczODY4MzAxNn0.KvszSzbNnaMINJKan6GzpGWN0u9TLnxJ9Xi1v5SDMvU','2025-02-04 10:30:36','2025-02-04 21:00:16'),(23,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjUwMzksImV4cCI6MTczODY4MzAzOX0.JzqtACG8QeVAB1xn2hHVJBDKffAaGohRsgEKRsJcjRM','2025-02-04 12:14:58','2025-02-04 21:00:39'),(24,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NzEzMDIsImV4cCI6MTczODY4OTMwMn0.eZel-BcQf7CIjfH3tsnma997OfkgYZDa5TVoAQuqZgw','2025-02-04 12:32:04','2025-02-04 22:45:02'),(25,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk0MjA5MTYsImV4cCI6MTczOTQzODkxNn0.ZCRmGQDaJthpa1yGg-aAvylaP2VX_NSrrHSLcj0CNrA','2025-02-13 04:39:11','2025-02-13 14:58:36'),(26,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTQyNDcsImV4cCI6MTczOTUzMjI0N30.jvdRSL2LcL2XT4INrkCyTO8k3EInz5Oej2dlehMRwJ0','2025-02-14 06:24:40','2025-02-14 16:54:07'),(27,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTU4NjAsImV4cCI6MTczOTUzMzg2MH0.aSx0elOWsSKaQUjShQ-pcn936kfgvheZS0bNqzrCyzE','2025-02-14 07:40:19','2025-02-14 17:21:00'),(28,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTg4MjMsImV4cCI6MTczOTUzNjgyM30.cr3AjRETNVq9szysdpR2rUaOuunbPIOnOJ_-dvl5nyM','2025-02-14 07:47:18','2025-02-14 18:10:23'),(29,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MjM1MjUsImV4cCI6MTczOTU0MTUyNX0.us8tOCqjFU1qAkDJK78_ThZV-lUSmZqfcdrCXEaWH30','2025-02-14 08:58:56','2025-02-14 19:28:45'),(30,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MjM1NDMsImV4cCI6MTczOTU0MTU0M30.rTwORa33o1iru4ANugqVM3_MzDNLZNndcomJqtW6SIY','2025-02-14 12:07:32','2025-02-14 19:29:03'),(31,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk3NjY5OTgsImV4cCI6MTczOTc4NDk5OH0.RyiEJmxZyYcWr5FA-RANEyVhslllLrL2yrFMLuoFUQ0','2025-02-17 08:13:38','2025-02-17 15:06:38'),(32,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk3ODAwMjMsImV4cCI6MTczOTc5ODAyM30.5zKbk35RG6reAbUUHMgF3bI0ZolxjljpuzFQye2IQ7U','2025-02-17 10:40:39','2025-02-17 18:43:43'),(33,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk4NTUzMjMsImV4cCI6MTczOTg3MzMyM30.1kg4dXfhdm0yr9R-xGbbWzKdQdFZ5HA4tylP6TvaWaE','2025-02-18 05:14:28','2025-02-18 15:38:43'),(34,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDA1NDUwODcsImV4cCI6MTc0MDU2MzA4N30.EuSgm7QLX-7wZ-Z8zWrXTnDY2KkXJITDxZgwsw9rqig','2025-02-26 08:32:30','2025-02-26 15:14:47'),(35,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDA3MTY2ODcsImV4cCI6MTc0MDczNDY4N30.YPrUN_sH1afUNs_4QjqMAGn2VsH0_9bWaW5kp1VFT94','2025-02-28 05:48:58','2025-02-28 14:54:47'),(36,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNjAyNDcsImV4cCI6MTc0MTA3ODI0N30.ZpA3RA3PSr2Yoe9zXLuO4WOR6Djfwc4PsUtbTkfsb8Y','2025-03-04 05:17:40','2025-03-04 14:20:47'),(37,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNjU0NjYsImV4cCI6MTc0MTA4MzQ2Nn0._03iQ7lmJUf-GoU17YGZGjfgMCjTzEeai9O98BRQEAU','2025-03-04 05:18:09','2025-03-04 15:47:46'),(38,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNzQ1NTcsImV4cCI6MTc0MTA5MjU1N30.mK6TzAh7DsFxxPMTlZ9wb6pbqw6ldTD25_Oz8b4zg6Y','2025-03-04 08:00:04','2025-03-04 18:19:17'),(39,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwODMyODgsImV4cCI6MTc0MTEwMTI4OH0.2Pd4ptbocPwJLhWGf-Hgq1uaNZZnsG2VFNWvfHA5W0E','2025-03-04 10:15:05','2025-03-04 20:44:48'),(40,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc0MjE4OTc3MywiZXhwIjoxNzQyMjA3NzczfQ.z5S30-pl32imhlCI2AbFfkJpnC8vM-z5EHntMWrpWro','2025-03-17 07:07:10','2025-03-17 16:06:13'),(41,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjE5NTIzNywiZXhwIjoxNzQyMjEzMjM3fQ.p50STa1BOnw24kRiEdbM8RfZsWAMGgKT4NpUoU4HMl0','2025-03-17 10:50:12','2025-03-17 17:37:17'),(42,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjIwODYxNSwiZXhwIjoxNzQyMjI2NjE1fQ.GKxbq3GOZ2JQqE2VtWMiN5g_Lzwnsuuh7XIN9HYV9a8','2025-03-17 10:54:51','2025-03-17 21:20:15'),(43,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjI5NTIzMCwiZXhwIjoxNzQyMzEzMjMwfQ.IKh4LLAH6Y9cF2By2y02y7PN7LtlYz2liJVH0OOLhms','2025-03-18 10:55:18','2025-03-18 21:23:50'),(44,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc0MjQ1MDMwMiwiZXhwIjoxNzQyNDY4MzAyfQ.XnoEM74nlVnL05V60z4GRhfoBgdMcBCjgWJ-xoxAbZ0','2025-03-20 07:31:49','2025-03-20 16:28:22'),(45,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDM0ODE3OTAsImV4cCI6MTc0MzQ5OTc5MH0.cAnVYj6ciyNZTT_pknTlwvGllKHpswq3GjcXchnMnMY','2025-04-01 06:24:05','2025-04-01 14:59:50'),(46,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQwOTUyMjksImV4cCI6MTc0NDExMzIyOX0.tUSAJn2bEstJeYDP2KMIeTYOYEOKszBqmsVCLD-ZxuI','2025-04-08 08:30:33','2025-04-08 17:23:49'),(47,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ3Nzc3NjAsImV4cCI6MTc0NDc5NTc2MH0.aZdqWoE7qRkgIMCGw6TWj03S47XiVjs6-m9Fi1TBmXQ','2025-04-16 06:17:05','2025-04-16 14:59:20'),(48,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDQ3OTczMjYsImV4cCI6MTc0NDgxNTMyNn0.eczLIXQKJymriRB-GzpcZF0ikuvZgDOxekrHo_AjmIc','2025-04-16 10:25:20','2025-04-16 20:25:26'),(49,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ3OTkxMjYsImV4cCI6MTc0NDgxNzEyNn0.CPB0KdNl1dXLuzu3S1cvxuRSpbIdP24ackb4-ZSVA4E','2025-04-16 10:49:00','2025-04-16 20:55:26'),(50,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ4NzM3NjYsImV4cCI6MTc0NDg5MTc2Nn0.ERk-VfFEccCjXpIxgEAQSts-ETLCDbpUhb0lq5lqTeQ','2025-04-17 07:27:53','2025-04-17 17:39:26'),(51,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDQ5NTkxODIsImV4cCI6MTc0NDk3NzE4Mn0.9nz3ScNwoXyB34Ctp30E2FmIp94ymaZ2Uwuh8s-pBR4','2025-04-18 07:10:52','2025-04-18 17:23:02'),(52,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyMzA5MywiZXhwIjoxNzQ1MjQxMDkzfQ.l-PLPFzc3lM2q8t0b5GMc8ca8Vnt1oiHOIgsmCENGns','2025-04-21 08:11:58','2025-04-21 18:41:33'),(53,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNDQwMSwiZXhwIjoxNzQ1MjQyNDAxfQ.QpQ0Bo7WsnjXkCHrQPsiiRYQsrekskHRYHLuG5Lc3y8','2025-04-21 08:35:42','2025-04-21 19:03:21'),(54,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNDU1NywiZXhwIjoxNzQ1MjQyNTU3fQ.WZEZc9eJIozwdLaHCwrWLSGPs9z2UwSsPL6EjI7z1-8','2025-04-21 08:48:12','2025-04-21 19:05:57'),(55,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTMwOSwiZXhwIjoxNzQ1MjQzMzA5fQ.SheXRFWw-YDVF-YJt2pjSKn62GsCOx7tXkrwPp60A3A','2025-04-21 08:50:55','2025-04-21 19:18:29'),(56,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTQ2OSwiZXhwIjoxNzQ1MjQzNDY5fQ.WdRgJVCF1b5rl4Ptx_lP2fRfGFUOUlkT5276P0cMUAw','2025-04-21 08:53:40','2025-04-21 19:21:09'),(57,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTYzMSwiZXhwIjoxNzQ1MjQzNjMxfQ.VYnl-Rg6odJfcnoJS-GB6_VYz_hMcOtoGXl0nTUfg1U','2025-04-21 11:04:27','2025-04-21 19:23:51'),(58,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIzMzYyMSwiZXhwIjoxNzQ1MjUxNjIxfQ.CIHzKpdZpNitNPtdAGo20VLoubC3cqZbGmt8H2AHQro','2025-04-21 13:14:11','2025-04-21 16:07:01'),(59,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MTM2MiwiZXhwIjoxNzQ1MjU5MzYyfQ.58CRJWmyDSNLNwuuqHXrbcq9ipb8LEemZnwTnvYUEUo','2025-04-21 13:51:50','2025-04-21 23:46:02'),(60,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzUyMywiZXhwIjoxNzQ1MjYxNTIzfQ.USpFQV-sTrnLnBE2roDYI7I2gH29qD0x9eRgZYhwC6w','2025-04-21 13:52:25','2025-04-22 00:22:03'),(61,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzU1NCwiZXhwIjoxNzQ1MjYxNTU0fQ.QWk0m5YHNIJx5sFS3TrdVx4Op_zr7Xsx_Yoxz3Kkb_c','2025-04-21 13:53:44','2025-04-22 00:22:34'),(62,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzYzMiwiZXhwIjoxNzQ1MjYxNjMyfQ.zQd9QN8aqTTJMm2mlbnTumSRVNdpbAO_uurW3m7IXlQ','2025-04-21 13:56:02','2025-04-22 00:23:52'),(63,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1Mjk2OTY4LCJleHAiOjE3NDUzMTQ5Njh9.8PDZ5QIRgGrxKal-WQNR7595ciu7eZKo5xGEL_vpj2A','2025-04-22 07:18:56','2025-04-22 15:12:48'),(64,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzA2NzkzLCJleHAiOjE3NDUzMjQ3OTN9.lDDdLKMJ1B4gWR8FubHfEnz6cjEy80MXCn3_3aeLuCU','2025-04-22 09:49:33','2025-04-22 17:56:33'),(65,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE2MDE3LCJleHAiOjE3NDUzMzQwMTd9.FOL4KznHSCCuDgjOZvbslbuOH6Tyb1am8Xm06o8a-8Y','2025-04-22 10:17:54','2025-04-22 15:00:17'),(66,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDUzMTczOTQsImV4cCI6MTc0NTMzNTM5NH0.TgrdBmb-nc_el01qGPtrOSo1dqARIzw8vtTBzZmwWFE','2025-04-22 10:23:18','2025-04-22 20:53:14'),(67,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE3NDE5LCJleHAiOjE3NDUzMzU0MTl9.b34BTA3-ndJAtJNEjo07TIzT73oeqCI6eTMjmvaR1vA','2025-04-22 10:42:10','2025-04-22 20:53:39'),(68,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE4NTQ3LCJleHAiOjE3NDUzMzY1NDd9.rto8fhdyNdq63BlDgGHgj0bBlcu5sHR1soDdkt9G6Zo','2025-04-22 10:58:17','2025-04-22 21:12:27'),(69,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE5NTExLCJleHAiOjE3NDUzMzc1MTF9.CGu1xovSaYe1FUZ0MiwAqzscwpGJGlhhllQPECle-QA','2025-04-22 10:59:09','2025-04-22 21:28:31'),(70,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE5NTY1LCJleHAiOjE3NDUzMzc1NjV9.d3_fF8jKKYWSm_Y34e6IryHryDIPfNPx7SAeeev8X4Q','2025-04-22 11:01:49','2025-04-22 21:29:25'),(71,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE5NzI4LCJleHAiOjE3NDUzMzc3Mjh9.5qg3aoc4F8891fQ-YCSHFN1_7C-CFc9LPIiWrVgb-fg','2025-04-22 11:08:01','2025-04-22 21:32:08'),(72,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwMTAxLCJleHAiOjE3NDUzMzgxMDF9.4bVk3AGkG_uKJiVFv9HhsG1qrjyBWcNLFDrOkSm6FAQ','2025-04-22 11:08:35','2025-04-22 21:38:21'),(73,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwMTU1LCJleHAiOjE3NDUzMzgxNTV9.MDLDlQ2ovDBhytFiL3-VrV9LzEAGzKU_CizcNoFmWeI','2025-04-22 11:20:39','2025-04-22 21:39:15'),(74,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzIwODUzLCJleHAiOjE3NDUzMzg4NTN9.fJHNYwxAoOZyw0R53dRbhd_KpXuf0LOr8FXZv1CA4rI','2025-04-22 11:21:12','2025-04-22 21:50:53'),(75,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzA0MTc0LCJleHAiOjE3NDUzMjIxNzR9.IihCaQUZazXjtIbucTYaJiOqm93-ver6G3m6niCJWH8','2025-04-22 11:35:52','2025-04-22 11:42:54'),(76,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwODk0LCJleHAiOjE3NDUzMzg4OTR9.WmConU0zb9rUE5RxhQ4iSsmN3yas0jVxT4UTQOmqjtE','2025-04-22 11:59:28','2025-04-22 21:51:34'),(77,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDE0ODQ3LCJleHAiOjE3NDU0MzI4NDd9.AV1ko4hUqzoXCcxyQijj1XHFhBofDmcpUKAl0zbiFFs','2025-04-23 13:34:23','2025-04-23 23:57:27'),(78,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDY5MTYxLCJleHAiOjE3NDU0ODcxNjF9.-HZXO2VPYakiEaLyZSWN-HgPdmzQJ3E_I7HM4TLEyXs','2025-04-24 05:28:17','2025-04-24 09:32:41'),(79,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyNzkyLCJleHAiOjE3NDU0OTA3OTJ9.0ogNJ28J4PaZhkY6H2S0ieqgl4g6QQNn3uE1K7I16g0','2025-04-24 05:34:04','2025-04-24 10:33:12'),(80,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyNjY2LCJleHAiOjE3NDU0OTA2NjZ9.uzPIm7k04FTuNfaHjiPH5GfrwUuEAbn5sbKuu3dGqg0','2025-04-24 05:34:44','2025-04-24 10:31:06'),(81,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyODczLCJleHAiOjE3NDU0OTA4NzN9.uTJsit94qKifCzQsa-qntqee33xaZ3Qr7PeOFobuhzg','2025-04-24 05:35:03','2025-04-24 10:34:33'),(82,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzMjI1LCJleHAiOjE3NDU2MDEyMjV9.gPIctmrQsWgzcVTaK093VWOTgjtxpUWndqAgFCwzjqU','2025-04-25 12:22:34','2025-04-25 22:43:45'),(83,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM3NjAsImV4cCI6MTc0NTYwMTc2MH0.JcClCBBDzOhRnnaBP7qDLdX-_rRDR2VuDtlSwKMyw5g','2025-04-25 12:23:07','2025-04-25 22:52:40'),(84,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM3OTksImV4cCI6MTc0NTYwMTc5OX0.xVHKPYgprc-j5kZCLnFv8xHuf24o-kzckMkv0cVXdCU','2025-04-25 12:23:33','2025-04-25 22:53:19'),(85,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM4NzcsImV4cCI6MTc0NTYwMTg3N30.ZcERyoSMM4lruHqSw91XiiR0PfSY3yy3xQOdj4v2BY0','2025-04-25 12:24:51','2025-04-25 22:54:37'),(86,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzODk1LCJleHAiOjE3NDU2MDE4OTV9.ieB6M9rYysd3qmqTOPLUgnaECFMKqnbOYEPZ80Csn4A','2025-04-25 12:26:14','2025-04-25 17:24:55'),(87,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzOTc5LCJleHAiOjE3NDU2MDE5Nzl9.VKR_5aOY-CqE7PUSNv173cHzLvwMacwDMraOXvXNjZE','2025-04-25 12:28:53','2025-04-25 17:26:19'),(88,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg0MTcyLCJleHAiOjE3NDU2MDIxNzJ9.gZX9rYDmS4Xz5Gz_2-FAW56y6ZusY1TxLK6eUW4KeWM','2025-04-25 12:31:03','2025-04-25 17:29:32'),(89,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDU1ODQyNzEsImV4cCI6MTc0NTYwMjI3MX0.yk7gdXwEl5sM7SIY9dYdnmM6JRdK_t7eAqYld-dnppc','2025-04-25 12:32:02','2025-04-25 17:31:11'),(90,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg2MDk1LCJleHAiOjE3NDU2MDQwOTV9.eKS2EtRkxjVcSFn2j1Ybx8Mv30BsZ09VBV-CMffTpd0','2025-04-25 13:02:26','2025-04-25 23:31:35'),(91,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg2MTUwLCJleHAiOjE3NDU2MDQxNTB9.LGmrLOi9jehMu7NLdywuRSU4nKiwdZuG6EEzhjTE9lw','2025-04-25 13:05:15','2025-04-25 23:32:30'),(92,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1OTA5MTE1LCJleHAiOjE3NDU5MjcxMTV9.gmdu0L4ogSQXiVl7_cvW_4qCPvFOahbpUOdZrlGLtX8','2025-04-29 06:58:39','2025-04-29 11:45:15'),(93,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2MTYzMDk0LCJleHAiOjE3NDYxODEwOTR9.ZwkUzQXj7C2WgOzAaoXoNHZ-FTjryD3XbJK1E5rySz4','2025-05-02 05:18:25','2025-05-02 10:18:14'),(94,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2NDIzMzczLCJleHAiOjE3NDY0NDEzNzN9.9Hp0XgJtg2OAYpspDH61G98aRQ7adapcv7zaoREBnbk','2025-05-05 05:40:37','2025-05-05 16:06:13'),(95,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NDI2MzUxLCJleHAiOjE3NDY0NDQzNTF9.hrJ7f_nroKnW23qOK3wuBoO7OKYrJoujHw76d3eTUgw','2025-05-05 07:37:43','2025-05-05 11:25:51'),(96,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2NTA1NzE3LCJleHAiOjE3NDY1MjM3MTd9.jvAfaZ4qtwyGuVIL8nyuiWI2DF4rONPDVP-vTkpGBlA','2025-05-06 09:13:51','2025-05-06 09:28:37'),(97,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NjA0OTA4LCJleHAiOjE3NDY2MjI5MDh9.B4iwBJEZb4VSCqlKRicsjHelt6n-X2nTupOMNOHXUnw','2025-05-07 08:45:12','2025-05-07 13:01:48'),(98,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NjExNDk5LCJleHAiOjE3NDY2Mjk0OTl9.-4DODISGn3PtJUBdDII9QN2w8EWP0H140d6YHImgGqw','2025-05-07 10:06:55','2025-05-07 14:51:39'),(99,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2Njk3MjEwLCJleHAiOjE3NDY3MTUyMTB9.PFS-ss-lcEoGsLEOb_1_-vkWUYJdwPTK9a81lGsFLZ8','2025-05-08 10:33:06','2025-05-08 14:40:10'),(100,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NzAxMDQwLCJleHAiOjE3NDY3MTkwNDB9.ytTP9Ibqn8KusZTfgKfN9SF48aaapZT9YHyDvRi74K0','2025-05-08 12:21:18','2025-05-08 15:44:00'),(101,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NzA2ODkxLCJleHAiOjE3NDY3MjQ4OTF9.7rj564fHHXrDYW-qhRdoJAsGIZ8L1Nb9UYTaBaGgrYY','2025-05-08 12:21:42','2025-05-08 17:21:31'),(102,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2NzY3OTE2LCJleHAiOjE3NDY3ODU5MTZ9.bSOUUIHig-l1EKfE-meTkrCCq46WLyDLy3uKCgRGgb4','2025-05-09 08:01:45','2025-05-09 10:18:36'),(103,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2Nzc3NzExLCJleHAiOjE3NDY3OTU3MTF9.xeq-oWGMCYoOZL4h93jVSTGsZ_0cQRT6lFbB83hgrbM','2025-05-09 08:15:19','2025-05-09 13:01:51'),(104,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2Nzc5MjE4LCJleHAiOjE3NDY3OTcyMTh9.Wgx70YQe-5jp8mBv3Pho4yo18bHWlotdkpEgu92xjfw','2025-05-09 11:07:21','2025-05-09 18:56:58'),(105,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ3Mjg0MjQyLCJleHAiOjE3NDczMDIyNDJ9.Q_JXX7t3Dt_oA5iIYq-YBgXFD46q6zikwFTi_AXupcI','2025-05-15 04:44:43','2025-05-15 09:44:02'),(106,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ3MjkwNzkxLCJleHAiOjE3NDczMDg3OTF9.KCUPyDAPv9ujnyZzsg7kSL5isJb5S9tbDSmoDlbDN0k','2025-05-15 08:16:50','2025-05-15 17:03:11'),(107,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxODYsImVtYWlsIjoiY2hhbmRhbi55YWRhdkBiaXRyb290Lm9yZyIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzI5NzEzOCwiZXhwIjoxNzQ3MzE1MTM4fQ.eQBVCnp0w0iaa_WHs95WA7DodPYojd5pSD1YGLHXO3w','2025-05-15 10:43:24','2025-05-15 18:48:58'),(108,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxODYsImVtYWlsIjoiY2hhbmRhbi55YWRhdkBiaXRyb290Lm9yZyIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzMwNTgyMiwiZXhwIjoxNzQ3MzIzODIyfQ.nN8kn8cRieKAYVos9GrVaUNpa79Re6M9PmTrzh0JHWA','2025-05-15 10:45:01','2025-05-15 21:13:42'),(109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ3ODkzMzAyLCJleHAiOjE3NDc5MTEzMDJ9.e2fajPpSA2YVUtp9whfqashUqsmyBJxFzSz7uJddM34','2025-05-22 09:20:59','2025-05-22 10:55:02'),(110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzQ1OSwiZXhwIjoxNzQ3OTI1NDU5fQ.oMlCXpm3neWoHFPyaQz-DGsqk1SDlgfgQdY_wu33wNs','2025-05-22 09:54:11','2025-05-22 14:50:59'),(111,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzY5OSwiZXhwIjoxNzQ3OTI1Njk5fQ.gmYPiQfrivmaXKJtvFQoaMJW8q7kf5nzI5V6C_JqXzA','2025-05-22 09:58:01','2025-05-22 14:54:59'),(112,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzg5OCwiZXhwIjoxNzQ3OTI1ODk4fQ.IMBujW5oS1wPVshuOq6Wvw09BrpTSWOq83ltr1T7xlA','2025-05-22 10:06:21','2025-05-22 14:58:18'),(113,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODQxNCwiZXhwIjoxNzQ3OTI2NDE0fQ.JYu8J4wwsYpT5ffV1axsqGJKXTMidIJRDnrU5GUUDng','2025-05-22 10:07:35','2025-05-22 15:06:54'),(114,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODU3OCwiZXhwIjoxNzQ3OTI2NTc4fQ.QbG3hDKQ7cJlxXl-qd-ov72khqZpfxaD2O2q4qC2Z9Y','2025-05-22 10:09:43','2025-05-22 15:09:38'),(115,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODU5OCwiZXhwIjoxNzQ3OTI2NTk4fQ.Zyy36Q0oba4C6gDM2q6BDlSEpB3KytR6QZCmjedeRpI','2025-05-22 10:10:05','2025-05-22 15:09:58'),(116,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsImVtYWlsIjoiYzI5MDV5QGdtYWlsLmNvbSIsInJvbGVfaWQiOjIsImlhdCI6MTc0Nzk3NjMyNCwiZXhwIjoxNzQ3OTk0MzI0fQ.vPDUSamHineYolXxmHoQghW2ufM-Qxr8MjDVlBKnRww','2025-05-23 06:29:30','2025-05-23 15:28:44'),(117,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ3OTgxNzc0LCJleHAiOjE3NDc5OTk3NzR9.oieXTEDZIcmG9YEwgpdrO0tgTxvdibXyao1DgoE-9KI','2025-05-23 06:29:44','2025-05-23 16:59:34');
/*!40000 ALTER TABLE `blacklisted_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `therapist_id` int NOT NULL,
  `user_id` int NOT NULL,
  `slot_id` int NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `status` varchar(50) DEFAULT 'scheduled',
  PRIMARY KEY (`id`),
  KEY `therapist_id` (`therapist_id`),
  KEY `user_id` (`user_id`),
  KEY `slot_id` (`slot_id`),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`therapist_id`) REFERENCES `therapists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chat_sessions_ibfk_3` FOREIGN KEY (`slot_id`) REFERENCES `therapist_slots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL,
  `onboarding_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `psychological_safety_index` float DEFAULT NULL,
  `company_size` int DEFAULT NULL,
  `retention_rate` float DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `services_interested` json DEFAULT NULL,
  `additional_info` text,
  `contact_person_id` int DEFAULT NULL,
  `company_profile_url` varchar(255) DEFAULT NULL,
  `onboarding_status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `stress_level` int DEFAULT NULL,
  `engagement_score` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_contact_person` (`contact_person_id`),
  CONSTRAINT `fk_contact_person` FOREIGN KEY (`contact_person_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (23,'TheFruit','2025-04-18 23:26:29',80,3,66.6667,NULL,NULL,NULL,109,NULL,1,'2025-04-21 06:26:29','2025-05-25 15:56:03',1,51,72.3333),(24,'Neure','2025-04-22 05:40:51',NULL,60,100,NULL,NULL,NULL,111,NULL,1,'2025-04-22 05:40:51','2025-05-23 04:12:46',1,NULL,0),(26,'Starbucks','2025-05-07 09:53:03',NULL,50,0,NULL,NULL,NULL,126,NULL,1,'2025-05-07 09:53:03','2025-05-21 10:20:14',1,NULL,0),(27,'ABC Ltd','2025-05-07 09:55:49',NULL,100,0,NULL,NULL,NULL,129,NULL,1,'2025-05-07 09:55:49','2025-05-21 10:20:14',1,NULL,0),(50,'Fitnova','2025-05-22 09:43:20',75,100,0,NULL,NULL,NULL,204,NULL,1,'2025-05-22 09:43:20','2025-05-23 07:50:49',1,23,12.75),(51,'TestForTemplate','2025-05-23 10:54:39',NULL,10,0,NULL,NULL,NULL,217,NULL,1,'2025-05-23 10:54:39','2025-05-24 06:27:24',1,NULL,0);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_deactivation_requests`
--

DROP TABLE IF EXISTS `company_deactivation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_deactivation_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `deactivation_reason` varchar(100) NOT NULL,
  `detailed_reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `fk_company_deactivation` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_deactivation_requests`
--

LOCK TABLES `company_deactivation_requests` WRITE;
/*!40000 ALTER TABLE `company_deactivation_requests` DISABLE KEYS */;
INSERT INTO `company_deactivation_requests` VALUES (7,23,'No longer required','nothing','approved','2025-04-21 10:47:57','2025-04-21 10:52:21'),(8,50,'No longer required','jvgj','rejected','2025-05-23 06:31:16','2025-05-23 06:31:23');
/*!40000 ALTER TABLE `company_deactivation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_departments`
--

DROP TABLE IF EXISTS `company_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_departments` (
  `company_id` int NOT NULL,
  `department_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`company_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `company_departments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_departments`
--

LOCK TABLES `company_departments` WRITE;
/*!40000 ALTER TABLE `company_departments` DISABLE KEYS */;
INSERT INTO `company_departments` VALUES (23,10,'2025-04-21 06:26:30'),(24,1,'2025-04-22 05:40:51'),(26,5,'2025-05-07 09:53:04'),(27,4,'2025-05-07 09:55:50'),(50,3,'2025-05-22 09:43:20'),(50,7,'2025-05-22 09:43:20'),(51,6,'2025-05-23 10:54:39');
/*!40000 ALTER TABLE `company_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_employees`
--

DROP TABLE IF EXISTS `company_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_employees` (
  `company_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `engagement_score` int DEFAULT '0',
  `stress_level` float DEFAULT NULL,
  `psi` float DEFAULT NULL,
  `content_engagement_percentage` float DEFAULT '0',
  `stress_bar_updated` tinyint(1) DEFAULT '0',
  `assessment_completion` tinyint(1) DEFAULT '0',
  `employee_code` varchar(50) DEFAULT NULL,
  `stress_message` text,
  `last_activity_date` timestamp NULL DEFAULT NULL,
  `last_activity_type` enum('workshop','content','stress_update','assessment') DEFAULT NULL,
  `workshop_attendance_count` int DEFAULT '0',
  PRIMARY KEY (`company_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_last_activity` (`last_activity_date`),
  CONSTRAINT `company_employees_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_employees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_employees`
--

LOCK TABLES `company_employees` WRITE;
/*!40000 ALTER TABLE `company_employees` DISABLE KEYS */;
INSERT INTO `company_employees` VALUES (23,109,'2025-04-21 06:26:30',1,67,50,NULL,66.6667,1,0,NULL,'hello','2025-05-26 11:03:14','',1),(23,110,'2025-04-21 06:28:48',1,108,29,60,133.333,1,1,NULL,'Good','2025-05-26 11:03:14','',13),(23,199,'2025-05-22 06:26:10',1,42,75,100,66.6667,1,0,NULL,'Felling Good','2025-05-26 11:03:14','',0),(24,111,'2025-04-22 05:40:51',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(26,126,'2025-05-07 09:53:03',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(27,129,'2025-05-07 09:55:49',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(50,204,'2025-05-22 09:43:20',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(50,205,'2025-05-22 10:13:03',1,38,16,75,0,1,0,NULL,'feeling Good','2025-05-26 11:03:14','',1),(50,206,'2025-05-22 11:07:01',1,13,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',1),(50,207,'2025-05-22 11:07:01',1,13,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',1),(50,208,'2025-05-22 11:07:02',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(50,209,'2025-05-22 11:07:02',1,13,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',1),(50,210,'2025-05-22 11:07:03',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(50,213,'2025-05-23 04:22:47',1,25,29,75,0,1,0,NULL,'','2025-05-26 11:03:14','',0),(51,217,'2025-05-23 10:54:39',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(51,218,'2025-05-23 10:57:50',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0),(51,219,'2025-05-26 05:33:28',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-26 11:03:14','',0);
/*!40000 ALTER TABLE `company_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_gallery_assignments`
--

DROP TABLE IF EXISTS `company_gallery_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_gallery_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `gallery_item_id` int NOT NULL,
  `item_type` enum('image','video','document') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_company_gallery_assignments_company` (`company_id`),
  KEY `fk_company_gallery_assignments_gallery` (`gallery_item_id`),
  CONSTRAINT `fk_company_gallery_assignments_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_company_gallery_assignments_gallery` FOREIGN KEY (`gallery_item_id`) REFERENCES `gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_gallery_assignments`
--

LOCK TABLES `company_gallery_assignments` WRITE;
/*!40000 ALTER TABLE `company_gallery_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_gallery_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_metrics_history`
--

DROP TABLE IF EXISTS `company_metrics_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_metrics_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `month_year` date NOT NULL,
  `stress_level` int DEFAULT NULL,
  `retention_rate` float DEFAULT NULL,
  `engagement_score` float DEFAULT NULL,
  `psychological_safety_index` float DEFAULT NULL,
  `total_employees` int DEFAULT '0',
  `active_employees` int DEFAULT '0',
  `inactive_employees` int DEFAULT '0',
  `total_departments` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_metrics_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_metrics_history`
--

LOCK TABLES `company_metrics_history` WRITE;
/*!40000 ALTER TABLE `company_metrics_history` DISABLE KEYS */;
INSERT INTO `company_metrics_history` VALUES (1,23,'2025-01-01',60,88.7143,48.0333,50.7143,0,0,0,0,'2025-04-16 04:53:31'),(2,23,'2025-02-01',55,NULL,0,NULL,0,0,0,0,'2025-04-16 04:53:31'),(3,23,'2025-03-01',90,NULL,NULL,NULL,0,0,0,0,'2025-04-16 04:53:31'),(32,23,'2025-05-01',90,10,40,50,0,0,0,0,'2025-04-30 18:31:01'),(33,23,'2025-04-01',10,90,50.5,60,0,0,0,0,'2025-04-30 18:31:02'),(34,24,'2025-04-01',NULL,NULL,0,NULL,0,0,0,0,'2025-04-30 18:31:02'),(35,23,'2024-12-01',100,NULL,NULL,NULL,0,0,0,0,'2025-05-14 04:50:21');
/*!40000 ALTER TABLE `company_metrics_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_retention_history`
--

DROP TABLE IF EXISTS `company_retention_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_retention_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `employees_start` int NOT NULL,
  `employees_end` int NOT NULL,
  `new_additions` int NOT NULL,
  `deactivated_employees` int NOT NULL,
  `retention_rate` float NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_retention_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_retention_history`
--

LOCK TABLES `company_retention_history` WRITE;
/*!40000 ALTER TABLE `company_retention_history` DISABLE KEYS */;
INSERT INTO `company_retention_history` VALUES (10,23,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:06'),(11,24,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:07');
/*!40000 ALTER TABLE `company_retention_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_rewards`
--

DROP TABLE IF EXISTS `company_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `reward_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_company_reward` (`company_id`,`reward_id`),
  KEY `company_rewards_reward_fk` (`reward_id`),
  CONSTRAINT `company_rewards_company_fk` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_rewards_reward_fk` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_rewards`
--

LOCK TABLES `company_rewards` WRITE;
/*!40000 ALTER TABLE `company_rewards` DISABLE KEYS */;
INSERT INTO `company_rewards` VALUES (17,50,18);
/*!40000 ALTER TABLE `company_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_subscriptions`
--

DROP TABLE IF EXISTS `company_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `email_notification` tinyint(1) NOT NULL DEFAULT '0',
  `sms_notification` tinyint(1) NOT NULL DEFAULT '0',
  `workshop_event_reminder` tinyint(1) NOT NULL DEFAULT '0',
  `system_updates_announcement` tinyint(1) NOT NULL DEFAULT '0',
  `plan_type` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `renewal_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company` (`company_id`),
  CONSTRAINT `fk_company_subscriptions` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_subscriptions`
--

LOCK TABLES `company_subscriptions` WRITE;
/*!40000 ALTER TABLE `company_subscriptions` DISABLE KEYS */;
INSERT INTO `company_subscriptions` VALUES (2,23,0,0,1,1,'monthly','2025-02-28','2025-04-21 10:34:35','2025-04-24 05:31:25'),(3,24,1,1,1,1,'monthly','2025-05-22','2025-04-22 05:40:51','2025-04-22 05:40:51'),(5,26,1,1,1,1,'monthly','2025-06-07','2025-05-07 09:53:04','2025-05-07 09:53:04'),(6,27,1,1,1,1,'monthly','2025-06-07','2025-05-07 09:55:50','2025-05-07 09:55:50'),(29,50,0,1,1,1,'monthly','2025-06-22','2025-05-22 09:43:20','2025-05-22 11:39:50'),(30,51,1,1,1,1,'monthly','2025-06-23','2025-05-23 10:54:39','2025-05-23 10:54:39');
/*!40000 ALTER TABLE `company_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Human Resources','2024-01-01 10:00:00'),(2,'Marketing','2024-01-02 11:00:00'),(3,'Sales','2024-01-03 12:00:00'),(4,'Engineering','2024-01-04 13:00:00'),(5,'Finance','2024-01-05 14:00:00'),(6,'Customer Support','2024-01-06 15:00:00'),(7,'IT Services','2024-01-07 16:00:00'),(8,'Product Management','2024-01-08 17:00:00'),(9,'Legal','2024-01-09 18:00:00'),(10,'Operations','2024-01-10 19:00:00');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_daily_history`
--

DROP TABLE IF EXISTS `employee_daily_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_daily_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `stress_level` decimal(5,2) NOT NULL,
  `engagement_score` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `recorded_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_daily_history_ibfk_1` (`user_id`),
  KEY `employee_daily_history_ibfk_2` (`company_id`),
  CONSTRAINT `employee_daily_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `employee_daily_history_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=776 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_daily_history`
--

LOCK TABLES `employee_daily_history` WRITE;
/*!40000 ALTER TABLE `employee_daily_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_daily_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_daily_stress_history`
--

DROP TABLE IF EXISTS `company_daily_stress_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_daily_stress_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `stress_level` float DEFAULT NULL,
  `recorded_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_date` (`company_id`,`recorded_date`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_recorded_date` (`recorded_date`),
  CONSTRAINT `company_daily_stress_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_daily_stress_history`
--

LOCK TABLES `company_daily_stress_history` WRITE;
/*!40000 ALTER TABLE `company_daily_stress_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_daily_stress_history` ENABLE KEYS */;
UNLOCK TABLES;
INSERT INTO `employee_daily_history` VALUES (403,109,23,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(404,110,23,50.00,50.00,1,'2025-04-21','2025-04-21 18:30:00'),(413,109,23,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(414,110,23,50.00,50.00,1,'2025-04-22','2025-04-22 18:30:01'),(415,111,24,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(424,109,23,50.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(425,110,23,50.00,50.00,1,'2025-04-23','2025-04-23 18:30:01'),(426,111,24,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(435,109,23,50.00,25.00,1,'2025-04-26','2025-04-26 18:30:01'),(436,110,23,50.00,50.00,1,'2025-04-26','2025-04-26 18:30:01'),(437,111,24,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(446,109,23,50.00,25.00,1,'2025-04-27','2025-04-27 18:30:01'),(447,110,23,50.00,50.00,1,'2025-04-27','2025-04-27 18:30:01'),(448,111,24,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(458,109,23,50.00,25.00,1,'2025-04-28','2025-04-28 18:30:01'),(459,110,23,50.00,50.00,1,'2025-04-28','2025-04-28 18:30:01'),(460,111,24,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(470,109,23,50.00,25.00,1,'2025-04-29','2025-04-29 18:30:00'),(471,110,23,50.00,50.00,1,'2025-04-29','2025-04-29 18:30:00'),(472,111,24,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(479,109,23,50.00,25.00,1,'2025-04-30','2025-04-30 18:30:00'),(480,110,23,50.00,58.00,1,'2025-04-30','2025-04-30 18:30:00'),(481,111,24,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(488,109,23,50.00,38.00,1,'2025-05-01','2025-05-01 18:30:01'),(489,110,23,70.00,63.00,1,'2025-05-01','2025-05-01 18:30:01'),(490,111,24,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(497,109,23,50.00,38.00,1,'2025-05-02','2025-05-02 18:30:01'),(498,110,23,70.00,38.00,1,'2025-05-02','2025-05-02 18:30:01'),(499,111,24,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(506,109,23,50.00,38.00,1,'2025-05-03','2025-05-03 18:30:01'),(507,110,23,70.00,38.00,1,'2025-05-03','2025-05-03 18:30:01'),(508,111,24,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(515,109,23,50.00,38.00,1,'2025-05-04','2025-05-04 18:30:01'),(516,110,23,70.00,38.00,1,'2025-05-04','2025-05-04 18:30:01'),(517,111,24,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(524,109,23,50.00,38.00,1,'2025-05-05','2025-05-05 18:30:01'),(525,110,23,29.00,38.00,1,'2025-05-05','2025-05-05 18:30:01'),(526,111,24,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(534,109,23,50.00,38.00,1,'2025-05-06','2025-05-06 18:30:00'),(535,110,23,29.00,38.00,1,'2025-05-06','2025-05-06 18:30:00'),(536,111,24,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(539,109,23,50.00,38.00,1,'2025-05-07','2025-05-07 18:30:00'),(540,110,23,29.00,60.00,1,'2025-05-07','2025-05-07 18:30:00'),(546,111,24,0.00,0.00,1,'2025-05-07','2025-05-07 18:30:00'),(548,126,26,0.00,0.00,1,'2025-05-07','2025-05-07 18:30:00'),(549,129,27,0.00,0.00,1,'2025-05-07','2025-05-07 18:30:00'),(551,109,23,50.00,38.00,1,'2025-05-08','2025-05-08 18:30:00'),(552,110,23,29.00,60.00,1,'2025-05-08','2025-05-08 18:30:00'),(558,111,24,0.00,0.00,1,'2025-05-08','2025-05-08 18:30:00'),(560,126,26,0.00,0.00,1,'2025-05-08','2025-05-08 18:30:00'),(561,129,27,0.00,0.00,1,'2025-05-08','2025-05-08 18:30:00'),(564,109,23,50.00,38.00,1,'2025-05-09','2025-05-09 20:30:00'),(565,110,23,29.00,60.00,1,'2025-05-09','2025-05-09 20:30:00'),(571,111,24,0.00,0.00,1,'2025-05-09','2025-05-09 20:30:00'),(573,126,26,0.00,0.00,1,'2025-05-09','2025-05-09 20:30:00'),(574,129,27,0.00,0.00,1,'2025-05-09','2025-05-09 20:30:00'),(577,109,23,50.00,38.00,1,'2025-05-10','2025-05-10 20:30:01'),(578,110,23,29.00,60.00,1,'2025-05-10','2025-05-10 20:30:01'),(584,111,24,0.00,0.00,1,'2025-05-10','2025-05-10 20:30:01'),(586,126,26,0.00,0.00,1,'2025-05-10','2025-05-10 20:30:01'),(587,129,27,0.00,0.00,1,'2025-05-10','2025-05-10 20:30:01'),(590,109,23,50.00,38.00,1,'2025-05-11','2025-05-11 20:30:01'),(591,110,23,29.00,60.00,1,'2025-05-11','2025-05-11 20:30:01'),(597,111,24,0.00,0.00,1,'2025-05-11','2025-05-11 20:30:01'),(599,126,26,0.00,0.00,1,'2025-05-11','2025-05-11 20:30:01'),(600,129,27,0.00,0.00,1,'2025-05-11','2025-05-11 20:30:01'),(603,109,23,50.00,38.00,1,'2025-05-12','2025-05-12 20:30:00'),(604,110,23,29.00,60.00,1,'2025-05-12','2025-05-12 20:30:00'),(610,111,24,0.00,0.00,1,'2025-05-12','2025-05-12 20:30:00'),(612,126,26,0.00,0.00,1,'2025-05-12','2025-05-12 20:30:00'),(613,129,27,0.00,0.00,1,'2025-05-12','2025-05-12 20:30:00'),(615,109,23,50.00,38.00,1,'2025-05-13','2025-05-13 20:30:00'),(616,110,23,29.00,60.00,1,'2025-05-13','2025-05-13 20:30:00'),(622,111,24,0.00,0.00,1,'2025-05-13','2025-05-13 20:30:00'),(624,126,26,0.00,0.00,1,'2025-05-13','2025-05-13 20:30:00'),(625,129,27,0.00,0.00,1,'2025-05-13','2025-05-13 20:30:00'),(628,109,23,50.00,38.00,1,'2025-05-14','2025-05-14 20:30:00'),(629,110,23,29.00,60.00,1,'2025-05-14','2025-05-14 20:30:00'),(630,111,24,0.00,0.00,1,'2025-05-14','2025-05-14 20:30:00'),(632,126,26,0.00,0.00,1,'2025-05-14','2025-05-14 20:30:00'),(633,129,27,0.00,0.00,1,'2025-05-14','2025-05-14 20:30:00'),(635,109,23,50.00,38.00,1,'2025-05-15','2025-05-15 20:30:01'),(636,110,23,29.00,60.00,1,'2025-05-15','2025-05-15 20:30:01'),(637,111,24,0.00,0.00,1,'2025-05-15','2025-05-15 20:30:01'),(639,126,26,0.00,0.00,1,'2025-05-15','2025-05-15 20:30:01'),(640,129,27,0.00,0.00,1,'2025-05-15','2025-05-15 20:30:01'),(644,109,23,50.00,38.00,1,'2025-05-16','2025-05-16 20:30:01'),(645,110,23,29.00,60.00,1,'2025-05-16','2025-05-16 20:30:01'),(646,111,24,0.00,0.00,1,'2025-05-16','2025-05-16 20:30:01'),(648,126,26,0.00,0.00,1,'2025-05-16','2025-05-16 20:30:01'),(649,129,27,0.00,0.00,1,'2025-05-16','2025-05-16 20:30:01'),(655,109,23,50.00,38.00,1,'2025-05-17','2025-05-17 20:30:01'),(656,110,23,29.00,60.00,1,'2025-05-17','2025-05-17 20:30:01'),(657,111,24,0.00,0.00,1,'2025-05-17','2025-05-17 20:30:01'),(659,126,26,0.00,0.00,1,'2025-05-17','2025-05-17 20:30:01'),(660,129,27,0.00,0.00,1,'2025-05-17','2025-05-17 20:30:01'),(666,109,23,50.00,38.00,1,'2025-05-19','2025-05-19 20:30:00'),(667,110,23,29.00,60.00,1,'2025-05-19','2025-05-19 20:30:00'),(668,111,24,0.00,0.00,1,'2025-05-19','2025-05-19 20:30:00'),(670,126,26,0.00,0.00,1,'2025-05-19','2025-05-19 20:30:00'),(671,129,27,0.00,0.00,1,'2025-05-19','2025-05-19 20:30:00'),(680,109,23,50.00,38.00,1,'2025-05-20','2025-05-20 20:30:01'),(681,110,23,29.00,60.00,1,'2025-05-20','2025-05-20 20:30:01'),(682,111,24,0.00,0.00,1,'2025-05-20','2025-05-20 20:30:01'),(684,126,26,0.00,0.00,1,'2025-05-20','2025-05-20 20:30:01'),(685,129,27,0.00,0.00,1,'2025-05-20','2025-05-20 20:30:01'),(694,109,23,50.00,50.00,1,'2025-05-21','2025-05-21 20:30:00'),(695,110,23,29.00,75.00,1,'2025-05-21','2025-05-21 20:30:00'),(696,111,24,0.00,0.00,1,'2025-05-21','2025-05-21 20:30:00'),(698,126,26,0.00,0.00,1,'2025-05-21','2025-05-21 20:30:00'),(699,129,27,0.00,0.00,1,'2025-05-21','2025-05-21 20:30:00'),(708,109,23,50.00,50.00,1,'2025-05-22','2025-05-22 20:30:00'),(709,110,23,29.00,75.00,1,'2025-05-22','2025-05-22 20:30:00'),(710,199,23,75.00,42.00,1,'2025-05-22','2025-05-22 20:30:00'),(711,111,24,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(712,126,26,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(713,129,27,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(715,204,50,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(716,205,50,16.00,50.00,1,'2025-05-22','2025-05-22 20:30:00'),(717,206,50,0.00,25.00,1,'2025-05-22','2025-05-22 20:30:00'),(718,207,50,0.00,25.00,1,'2025-05-22','2025-05-22 20:30:00'),(719,208,50,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(720,209,50,0.00,25.00,1,'2025-05-22','2025-05-22 20:30:00'),(721,210,50,0.00,0.00,1,'2025-05-22','2025-05-22 20:30:00'),(723,109,23,50.00,67.00,1,'2025-05-23','2025-05-23 20:30:01'),(724,110,23,29.00,100.00,1,'2025-05-23','2025-05-23 20:30:01'),(725,199,23,75.00,42.00,1,'2025-05-23','2025-05-23 20:30:01'),(726,111,24,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(727,126,26,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(728,129,27,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(730,204,50,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(731,205,50,16.00,38.00,1,'2025-05-23','2025-05-23 20:30:01'),(732,206,50,0.00,13.00,1,'2025-05-23','2025-05-23 20:30:01'),(733,207,50,0.00,13.00,1,'2025-05-23','2025-05-23 20:30:01'),(734,208,50,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(735,209,50,0.00,13.00,1,'2025-05-23','2025-05-23 20:30:01'),(736,210,50,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(737,213,50,29.00,25.00,1,'2025-05-23','2025-05-23 20:30:01'),(738,217,51,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(739,218,51,0.00,0.00,1,'2025-05-23','2025-05-23 20:30:01'),(741,109,23,50.00,67.00,1,'2025-05-24','2025-05-24 20:30:00'),(742,110,23,29.00,100.00,1,'2025-05-24','2025-05-24 20:30:00'),(743,199,23,75.00,42.00,1,'2025-05-24','2025-05-24 20:30:00'),(744,111,24,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(745,126,26,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(746,129,27,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(748,204,50,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(749,205,50,16.00,38.00,1,'2025-05-24','2025-05-24 20:30:00'),(750,206,50,0.00,13.00,1,'2025-05-24','2025-05-24 20:30:00'),(751,207,50,0.00,13.00,1,'2025-05-24','2025-05-24 20:30:00'),(752,208,50,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(753,209,50,0.00,13.00,1,'2025-05-24','2025-05-24 20:30:00'),(754,210,50,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(755,213,50,29.00,25.00,1,'2025-05-24','2025-05-24 20:30:00'),(756,217,51,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(757,218,51,0.00,0.00,1,'2025-05-24','2025-05-24 20:30:00'),(759,109,23,50.00,67.00,1,'2025-05-25','2025-05-25 20:30:01'),(760,110,23,29.00,108.00,1,'2025-05-25','2025-05-25 20:30:01'),(761,199,23,75.00,42.00,1,'2025-05-25','2025-05-25 20:30:01'),(762,111,24,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(763,126,26,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(764,129,27,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(766,204,50,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(767,205,50,16.00,38.00,1,'2025-05-25','2025-05-25 20:30:01'),(768,206,50,0.00,13.00,1,'2025-05-25','2025-05-25 20:30:01'),(769,207,50,0.00,13.00,1,'2025-05-25','2025-05-25 20:30:01'),(770,208,50,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(771,209,50,0.00,13.00,1,'2025-05-25','2025-05-25 20:30:01'),(772,210,50,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(773,213,50,29.00,25.00,1,'2025-05-25','2025-05-25 20:30:01'),(774,217,51,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01'),(775,218,51,0.00,0.00,1,'2025-05-25','2025-05-25 20:30:01');
/*!40000 ALTER TABLE `employee_daily_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_rewards`
--

DROP TABLE IF EXISTS `employee_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rewarded_by` int DEFAULT NULL,
  `reward_id` int NOT NULL,
  `awarded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `claimed_status` tinyint(1) DEFAULT '0',
  `claimed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`,`user_id`),
  KEY `reward_id` (`reward_id`),
  KEY `employee_rewards_rewarded_by_fk` (`rewarded_by`),
  CONSTRAINT `employee_rewards_ibfk_1` FOREIGN KEY (`company_id`, `user_id`) REFERENCES `company_employees` (`company_id`, `user_id`) ON DELETE CASCADE,
  CONSTRAINT `employee_rewards_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_rewards_rewarded_by_fk` FOREIGN KEY (`rewarded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_rewards`
--

LOCK TABLES `employee_rewards` WRITE;
/*!40000 ALTER TABLE `employee_rewards` DISABLE KEYS */;
INSERT INTO `employee_rewards` VALUES (48,23,110,110,1,'2025-04-21 09:13:54',1,'2025-05-05 05:11:32'),(49,23,110,110,1,'2025-04-25 06:57:53',1,'2025-05-05 05:11:35'),(50,23,110,110,3,'2025-04-25 08:28:24',1,'2025-05-05 05:11:45'),(51,23,110,110,8,'2025-04-25 08:28:50',1,'2025-05-05 05:12:31'),(52,23,109,109,2,'2025-04-28 06:09:45',0,NULL),(53,23,110,110,7,'2025-04-29 06:10:38',1,'2025-04-30 10:58:37'),(54,23,110,110,5,'2025-04-30 12:42:18',1,'2025-04-30 12:42:43'),(55,23,109,109,1,'2025-05-07 09:44:26',0,NULL),(56,23,110,110,2,'2025-05-07 10:38:25',1,'2025-05-07 10:39:22'),(57,23,110,110,6,'2025-05-08 10:42:11',1,'2025-05-08 10:42:25'),(58,23,110,110,8,'2025-05-09 11:14:43',1,'2025-05-09 11:15:35'),(64,50,205,205,1,'2025-05-22 11:48:08',1,'2025-05-22 11:52:44'),(65,50,205,205,2,'2025-05-22 11:50:37',0,NULL),(66,50,213,213,1,'2025-05-23 04:58:59',1,'2025-05-23 05:12:56'),(68,50,213,213,1,'2025-05-23 05:07:30',1,'2025-05-23 05:21:25'),(69,50,213,213,2,'2025-05-23 05:08:21',1,'2025-05-23 11:00:05'),(70,50,213,213,3,'2025-05-23 05:11:59',0,NULL),(71,50,213,213,5,'2025-05-23 05:24:04',0,NULL),(72,50,213,213,6,'2025-05-23 05:25:14',0,NULL),(73,50,213,213,8,'2025-05-23 05:26:31',0,NULL),(74,50,213,213,7,'2025-05-23 05:27:15',0,NULL),(75,50,205,205,18,'2025-05-23 10:00:32',0,NULL),(76,50,208,208,18,'2025-05-23 10:00:32',0,NULL),(77,50,213,213,2,'2025-05-23 10:05:48',0,NULL),(78,50,213,213,5,'2025-05-23 10:23:11',0,NULL),(79,50,213,213,1,'2025-05-23 10:27:31',0,NULL),(80,50,213,213,2,'2025-05-23 10:30:56',0,NULL),(81,50,213,213,1,'2025-05-23 10:32:09',0,NULL),(82,50,213,213,1,'2025-05-23 10:33:06',0,NULL),(83,50,213,213,1,'2025-05-23 10:59:27',0,NULL);
/*!40000 ALTER TABLE `employee_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `feedback_description` text NOT NULL,
  `feedback_type` enum('bug','suggestion','other') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (6,23,'hello','bug','2025-04-28 06:19:42','2025-04-28 06:19:42'),(7,23,'hehehe','suggestion','2025-05-07 10:30:31','2025-05-07 10:30:31'),(8,23,'hi no suggestions','suggestion','2025-05-07 10:30:58','2025-05-07 10:30:58'),(10,50,'Doing good','other','2025-05-22 11:47:34','2025-05-22 11:47:34'),(11,50,'ggg','suggestion','2025-05-23 06:59:50','2025-05-23 06:59:50');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `tags` json DEFAULT NULL,
  `file_type` enum('image','video','document') NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `size` int NOT NULL,
  `duration` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
INSERT INTO `gallery` VALUES (4,'ABCD','description',NULL,'document','https://neure-staging.s3.ap-south-1.amazonaws.com/gallery/1/document/o7Hv6upq-a2xpU92Xfbd1.pdf',319690,NULL,'2025-03-18 10:13:48','2025-03-27 10:54:26'),(22,'Gallery test','fcghvbjknmlFcghvbjknml ','[\"sample\", \"image\", \"gallery\"]','video','https://youtu.be/ZjkYWz53DfU?si=vU8-3qOLdvKzGDXr',0,NULL,'2025-03-28 04:50:32','2025-04-03 07:19:40'),(33,'Forest','Rainy Forest','[\"Forest\", \"Rain\"]','image','https://neure-staging.s3.ap-south-1.amazonaws.com/gallery/image/rBRUY6ZGU7cGspE6pAM9y.jpg',0,NULL,'2025-05-16 12:45:24','2025-05-16 12:45:24');
/*!40000 ALTER TABLE `gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` enum('credit_card','bank_transfer','paypal','other') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `fk_invoices_company` (`company_id`),
  CONSTRAINT `fk_invoices_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `company_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delivery_method` set('IN_APP','EMAIL','SMS') NOT NULL DEFAULT 'IN_APP',
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_ibfk_2` (`user_id`),
  KEY `notifications_ibfk_1` (`company_id`),
  KEY `idx_type_status` (`type`,`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=516 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (280,'Assessment Submission Result: Depression Screening Test','You have completed the assessment \"Depression Screening Test\" with a score of 70.8%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-14 10:41:28','2025-05-14 10:41:51','IN_APP',NULL),(281,'Assessment Submission Result: Stress Management Assessment','You have completed the assessment \"Stress Management Assessment\" with a score of 0.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-14 10:46:21','2025-05-14 11:37:34','IN_APP',NULL),(282,'Workshop Reminder: Prioritizing Mental Health in the Workplace','Reminder: Your workshop \"Prioritizing Mental Health in the Workplace\" is scheduled for today at 04:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',24,111,'2025-05-14 19:30:01','2025-05-14 19:30:01','IN_APP',NULL),(288,'Workshop Rescheduled: Prioritizing Mental Health in the Workplace','The workshop \"Prioritizing Mental Health in the Workplace\" has been rescheduled to Thursday, May 15, 2025 at 02:00 PM. Please update your calendar.','WORKSHOP_RESCHEDULED','MEDIUM',1,'PENDING',23,110,'2025-05-15 08:14:31','2025-05-16 11:06:47','IN_APP',NULL),(318,'Workshop Rescheduled: Unleash your superhero','The workshop \"Unleash your superhero\" has been rescheduled to Friday, May 16, 2025 at 03:28 PM. Please update your calendar.','WORKSHOP_RESCHEDULED','MEDIUM',1,'PENDING',23,110,'2025-05-16 09:58:56','2025-05-16 11:06:47','IN_APP',NULL),(336,'New Assessment Available: Test for point value','A new assessment \"Test for point value\" has been assigned to you. \n\nDescription: Test for point value','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 05:40:39','2025-05-21 05:40:39','IN_APP',NULL),(337,'New Assessment Available: Test for point value','A new assessment \"Test for point value\" has been assigned to you. \n\nDescription: Test for point value','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 05:40:39','2025-05-21 05:40:39','IN_APP',NULL),(339,'New Assessment Available: Test for point value','A new assessment \"Test for point value\" has been assigned to you. \n\nDescription: Test for point value','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 05:40:39','2025-05-21 12:10:01','IN_APP',NULL),(342,'New Assessment Available: Test for point value','A new assessment \"Test for point value\" has been assigned to you. \n\nDescription: Test for point value','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 05:40:39','2025-05-21 05:40:39','IN_APP',NULL),(343,'New Assessment Available: Test for point value','A new assessment \"Test for point value\" has been assigned to you. \n\nDescription: Test for point value','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 05:40:39','2025-05-22 07:32:44','IN_APP',NULL),(350,'New Assessment Available: test with range data','A new assessment \"test with range data\" has been assigned to you. \n\nDescription: test with range data','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 05:50:10','2025-05-21 05:50:10','IN_APP',NULL),(351,'New Assessment Available: test with range data','A new assessment \"test with range data\" has been assigned to you. \n\nDescription: test with range data','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 05:50:10','2025-05-21 05:50:10','IN_APP',NULL),(352,'New Assessment Available: test with range data','A new assessment \"test with range data\" has been assigned to you. \n\nDescription: test with range data','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 05:50:10','2025-05-21 12:10:01','IN_APP',NULL),(353,'New Assessment Available: test with range data','A new assessment \"test with range data\" has been assigned to you. \n\nDescription: test with range data','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 05:50:10','2025-05-22 07:32:44','IN_APP',NULL),(356,'New Assessment Available: test with range data','A new assessment \"test with range data\" has been assigned to you. \n\nDescription: test with range data','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 05:50:10','2025-05-21 05:50:10','IN_APP',NULL),(366,'New Assessment Available: Test with points and range','A new assessment \"Test with points and range\" has been assigned to you. \n\nDescription: Test with points and range','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 06:13:00','2025-05-22 07:32:44','IN_APP',NULL),(368,'New Assessment Available: Test with points and range','A new assessment \"Test with points and range\" has been assigned to you. \n\nDescription: Test with points and range','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 06:13:00','2025-05-21 12:10:01','IN_APP',NULL),(369,'New Assessment Available: Test with points and range','A new assessment \"Test with points and range\" has been assigned to you. \n\nDescription: Test with points and range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 06:13:00','2025-05-21 06:13:00','IN_APP',NULL),(370,'New Assessment Available: Test with points and range','A new assessment \"Test with points and range\" has been assigned to you. \n\nDescription: Test with points and range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 06:13:00','2025-05-21 06:13:00','IN_APP',NULL),(372,'New Assessment Available: Test with points and range','A new assessment \"Test with points and range\" has been assigned to you. \n\nDescription: Test with points and range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 06:13:00','2025-05-21 06:13:00','IN_APP',NULL),(378,'Assessment Submission Result: Test with points and range','You have completed the assessment \"Test with points and range\" with a score of 75.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-21 06:41:04','2025-05-21 12:10:01','IN_APP',NULL),(382,'New Assessment Available: PSI test','A new assessment \"PSI test\" has been assigned to you. \n\nDescription: PSI test','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 09:30:45','2025-05-21 12:10:01','IN_APP',NULL),(383,'New Assessment Available: PSI test','A new assessment \"PSI test\" has been assigned to you. \n\nDescription: PSI test','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 09:30:45','2025-05-22 07:32:44','IN_APP',NULL),(385,'New Assessment Available: PSI test','A new assessment \"PSI test\" has been assigned to you. \n\nDescription: PSI test','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 09:30:45','2025-05-21 09:30:45','IN_APP',NULL),(386,'New Assessment Available: PSI test','A new assessment \"PSI test\" has been assigned to you. \n\nDescription: PSI test','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 09:30:45','2025-05-21 09:30:45','IN_APP',NULL),(387,'New Assessment Available: PSI test','A new assessment \"PSI test\" has been assigned to you. \n\nDescription: PSI test','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 09:30:45','2025-05-21 09:30:45','IN_APP',NULL),(393,'Assessment Submission Result: PSI test','You have completed the assessment \"PSI test\" with a score of 66.7%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-21 09:46:52','2025-05-21 12:10:01','IN_APP',NULL),(394,'Assessment Submission Result: Test with points and range','You have completed the assessment \"Test with points and range\" with a score of 100.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-21 09:54:26','2025-05-21 12:10:01','IN_APP',NULL),(396,'New Assessment Available: Test PSI for new range','A new assessment \"Test PSI for new range\" has been assigned to you. \n\nDescription: test PSI for new range','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 11:21:25','2025-05-22 07:32:44','IN_APP',NULL),(399,'New Assessment Available: Test PSI for new range','A new assessment \"Test PSI for new range\" has been assigned to you. \n\nDescription: test PSI for new range','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 11:21:25','2025-05-21 12:10:01','IN_APP',NULL),(400,'New Assessment Available: Test PSI for new range','A new assessment \"Test PSI for new range\" has been assigned to you. \n\nDescription: test PSI for new range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 11:21:25','2025-05-21 11:21:25','IN_APP',NULL),(401,'New Assessment Available: Test PSI for new range','A new assessment \"Test PSI for new range\" has been assigned to you. \n\nDescription: test PSI for new range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 11:21:25','2025-05-21 11:21:25','IN_APP',NULL),(403,'New Assessment Available: Test PSI for new range','A new assessment \"Test PSI for new range\" has been assigned to you. \n\nDescription: test PSI for new range','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 11:21:25','2025-05-21 11:21:25','IN_APP',NULL),(410,'New Assessment Available: hello from neure','A new assessment \"hello from neure\" has been assigned to you. \n\nDescription: hello from neure','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-21 11:24:12','2025-05-21 11:24:12','IN_APP',NULL),(411,'New Assessment Available: hello from neure','A new assessment \"hello from neure\" has been assigned to you. \n\nDescription: hello from neure','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-21 11:24:12','2025-05-21 11:24:12','IN_APP',NULL),(412,'New Assessment Available: hello from neure','A new assessment \"hello from neure\" has been assigned to you. \n\nDescription: hello from neure','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-21 11:24:12','2025-05-21 11:24:12','IN_APP',NULL),(413,'New Assessment Available: hello from neure','A new assessment \"hello from neure\" has been assigned to you. \n\nDescription: hello from neure','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-21 11:24:12','2025-05-22 07:32:44','IN_APP',NULL),(414,'New Assessment Available: hello from neure','A new assessment \"hello from neure\" has been assigned to you. \n\nDescription: hello from neure','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-21 11:24:12','2025-05-21 12:10:01','IN_APP',NULL),(423,'Assessment Submission Result: hello from neure','You have completed the assessment \"hello from neure\" with a score of 60.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,110,'2025-05-21 11:24:34','2025-05-21 12:10:01','IN_APP',NULL),(424,'Password Changed Successfully','Your password was changed successfully on 5/22/2025, 6:27:50 AM. If you didn\'t perform this action, please contact support immediately.','ACCOUNT_UPDATE','MEDIUM',1,'PENDING',NULL,199,'2025-05-22 06:27:50','2025-05-22 06:36:04','IN_APP',NULL),(425,'Assessment Submission Result: PSI test','You have completed the assessment \"PSI test\" with a score of 100.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',23,199,'2025-05-22 07:48:13','2025-05-22 08:55:59','IN_APP',NULL),(426,'Password Changed Successfully','Your password was changed successfully on 5/22/2025, 10:00:19 AM. If you didn\'t perform this action, please contact support immediately.','ACCOUNT_UPDATE','MEDIUM',1,'PENDING',NULL,204,'2025-05-22 10:00:19','2025-05-22 11:40:49','IN_APP',NULL),(427,'Assessment Submission Result: PSI test','You have completed the assessment \"PSI test\" with a score of 66.7%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',50,205,'2025-05-22 10:48:13','2025-05-22 10:48:39','IN_APP',NULL),(428,'Profile Update','Your profile information has been updated. Updated fields: email, profile_url','PROFILE_UPDATE','MEDIUM',1,'PENDING',NULL,205,'2025-05-22 11:46:53','2025-05-22 11:47:08','IN_APP',NULL),(429,'New Reward Assigned','Congratulations! You have been assigned the reward \"Flexible Working Hours for a Day\" by Chandan Yadav.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,205,'2025-05-22 11:50:37','2025-05-22 11:52:37','IN_APP',NULL),(430,'Reward Redemption Alert','Chandan has redeemed the reward \"One-Day Work From Home\" that was assigned by Chandan.','REWARD_REDEMPTION','MEDIUM',1,'PENDING',50,204,'2025-05-22 11:52:44','2025-05-22 11:54:25','IN_APP',NULL),(431,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,206,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(432,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,208,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(433,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,207,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(434,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,210,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(435,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,205,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(436,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/22/2025 at 6:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,209,'2025-05-22 11:54:19','2025-05-22 11:54:19','IN_APP',NULL),(437,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',1,'PENDING',50,204,'2025-05-22 12:06:46','2025-05-22 12:15:45','IN_APP',NULL),(438,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,205,'2025-05-22 12:06:46','2025-05-22 12:06:46','IN_APP',NULL),(439,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,206,'2025-05-22 12:06:46','2025-05-22 12:06:46','IN_APP',NULL),(440,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,208,'2025-05-22 12:06:46','2025-05-22 12:06:46','IN_APP',NULL),(441,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,207,'2025-05-22 12:06:46','2025-05-22 12:06:46','IN_APP',NULL),(442,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,210,'2025-05-22 12:06:47','2025-05-22 12:06:47','IN_APP',NULL),(443,'Workshop Completed: Workshop by Bitroot','The workshop \"Workshop by Bitroot\" that was held on Thursday, May 22, 2025 at 06:00 PM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',50,209,'2025-05-22 12:06:47','2025-05-22 12:06:47','IN_APP',NULL),(445,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',23,199,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(446,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,109,'2025-05-22 12:39:17','2025-05-26 09:16:20','IN_APP',NULL),(447,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',1,'PENDING',23,110,'2025-05-22 12:39:17','2025-05-24 09:52:09','IN_APP',NULL),(448,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',26,126,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(449,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(450,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',27,129,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(452,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,205,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(453,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,206,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(454,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,207,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(455,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,208,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(456,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,209,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(457,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',0,'PENDING',50,210,'2025-05-22 12:39:17','2025-05-22 12:39:17','IN_APP',NULL),(458,'New Assessment Available: PSI (Psychological Self-Inventory)','A new assessment \"PSI (Psychological Self-Inventory)\" has been assigned to you. \n\nDescription: This assessment is designed to evaluate your current psychological state, including stress levels, emotional resilience, self-awareness, and cognitive behavior. The responses help identify patterns in how you handle pressure, manage your emotions, and interact with challenges in daily life. It is not a diagnostic tool, but rather a self-assessment for personal insight and improvement.','NEW_ASSESSMENT','MEDIUM',1,'PENDING',50,204,'2025-05-22 12:39:17','2025-05-23 05:16:03','IN_APP',NULL),(459,'Assessment Submission Result: PSI (Psychological Self-Inventory)','You have completed the assessment \"PSI (Psychological Self-Inventory)\" with a score of 75.0%.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',50,205,'2025-05-22 12:46:21','2025-05-22 12:46:21','IN_APP',NULL),(460,'Password Changed Successfully','Your password was changed successfully on 5/23/2025, 10:23:33 AM. If you didn\'t perform this action, please contact support immediately.','ACCOUNT_UPDATE','MEDIUM',1,'PENDING',NULL,213,'2025-05-23 04:53:33','2025-05-23 05:01:59','IN_APP',NULL),(461,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen Shinde.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 04:58:59','2025-05-23 05:02:32','IN_APP',NULL),(463,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:07:30','2025-05-23 05:16:22','IN_APP',NULL),(464,'New Reward Assigned','Congratulations! You have been assigned the reward \"Flexible Working Hours for a Day\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:08:21','2025-05-23 05:16:22','IN_APP',NULL),(465,'New Reward Assigned','Congratulations! You have been assigned the reward \"Early Leave Pass\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:11:59','2025-05-23 05:16:22','IN_APP',NULL),(466,'Reward Redemption Alert','Praveen has redeemed the reward \"One-Day Work From Home\" that was assigned by Praveen.','REWARD_REDEMPTION','MEDIUM',1,'PENDING',50,204,'2025-05-23 05:12:56','2025-05-23 05:16:03','IN_APP',NULL),(467,'Reward Claimed Notification','Praveen has claimed the reward \"One-Day Work From Home\" that you assigned to them.','REWARD_CLAIMED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:12:56','2025-05-23 05:16:22','IN_APP',NULL),(468,'Reward Claimed Notification','Praveen has claimed the reward \"One-Day Work From Home\" that you assigned to them.','REWARD_CLAIMED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:21:25','2025-05-23 07:01:05','IN_APP',NULL),(469,'New Reward Assigned','Congratulations! You have been assigned the reward \"One Day Leave Pass\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:24:04','2025-05-23 07:01:05','IN_APP',NULL),(470,'New Reward Assigned','Congratulations! You have been assigned the reward \"Meeting Free Day\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:25:14','2025-05-23 07:01:05','IN_APP',NULL),(471,'New Reward Assigned','Congratulations! You have been assigned the reward \"1-on-1 mentorship session with a Senior Executive\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:26:31','2025-05-23 07:01:05','IN_APP',NULL),(472,'New Reward Assigned','Congratulations! You have been assigned the reward \"Surprise Half Day\" by Praveen.','REWARD_ASSIGNED','MEDIUM',1,'PENDING',50,213,'2025-05-23 05:27:15','2025-05-23 07:01:05','IN_APP',NULL),(473,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,205,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(474,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,208,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(475,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,207,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(476,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,206,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(477,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,209,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(479,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',1,'PENDING',50,213,'2025-05-23 07:15:17','2025-05-23 09:36:01','IN_APP',NULL),(480,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:00:00 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',50,210,'2025-05-23 07:15:17','2025-05-23 07:15:17','IN_APP',NULL),(481,'Assessment Submission Result: PSI (Psychological Self-Inventory)','You have completed the assessment \"PSI (Psychological Self-Inventory)\" with a score of 75.0%.','ASSESSMENT_COMPLETED','MEDIUM',1,'PENDING',50,213,'2025-05-23 08:47:32','2025-05-23 09:36:01','IN_APP',NULL),(482,'New Reward Assigned','Congratulations! You have been assigned the reward \"helloe\" by Chandan.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,205,'2025-05-23 10:00:32','2025-05-23 10:00:32','IN_APP',NULL),(483,'New Reward Assigned','Congratulations! You have been assigned the reward \"helloe\" by Amit.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,208,'2025-05-23 10:00:32','2025-05-23 10:00:32','IN_APP',NULL),(484,'New Reward Assigned','Congratulations! You have been assigned the reward \"Flexible Working Hours for a Day\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:05:48','2025-05-23 10:05:48','IN_APP',NULL),(485,'New Reward Assigned','Congratulations! You have been assigned the reward \"One Day Leave Pass\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:23:11','2025-05-23 10:23:11','IN_APP',NULL),(486,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:27:31','2025-05-23 10:27:31','IN_APP',NULL),(487,'New Reward Assigned','Congratulations! You have been assigned the reward \"Flexible Working Hours for a Day\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:30:56','2025-05-23 10:30:56','IN_APP',NULL),(488,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:32:09','2025-05-23 10:32:09','IN_APP',NULL),(489,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:33:07','2025-05-23 10:33:07','IN_APP',NULL),(490,'New Reward Assigned','Congratulations! You have been assigned the reward \"One-Day Work From Home\" by Praveen.','REWARD_ASSIGNED','MEDIUM',0,'PENDING',50,213,'2025-05-23 10:59:27','2025-05-23 10:59:27','IN_APP',NULL),(491,'Reward Claimed Notification','Praveen has claimed the reward \"Flexible Working Hours for a Day\" that you assigned to them.','REWARD_CLAIMED','MEDIUM',0,'PENDING',50,213,'2025-05-23 11:00:05','2025-05-23 11:00:05','IN_APP',NULL),(492,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/23/2025 at 4:32:11 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-23 11:02:18','2025-05-23 11:02:18','IN_APP',NULL),(493,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/23/2025 at 4:35:18 PM. Duration: 20 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-23 11:05:22','2025-05-23 11:05:22','IN_APP',NULL),(494,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,204,'2025-05-23 19:30:01','2025-05-23 19:30:01','IN_APP',NULL),(495,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,208,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(496,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,205,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(497,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,206,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(498,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,209,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(499,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,213,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(500,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,210,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(501,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:00 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',50,207,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(502,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:32 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',51,218,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(503,'Workshop Reminder: Sharpen Your Focus: Mastering the Art of Deep Work','Reminder: Your workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" is scheduled for today at 04:32 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',51,217,'2025-05-23 19:30:02','2025-05-23 19:30:02','IN_APP',NULL),(504,'Workshop Reminder: Workshop by Bitroot','Reminder: Your workshop \"Workshop by Bitroot\" is scheduled for today at 04:35 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',51,218,'2025-05-23 19:30:03','2025-05-23 19:30:03','IN_APP',NULL),(505,'Workshop Reminder: Workshop by Bitroot','Reminder: Your workshop \"Workshop by Bitroot\" is scheduled for today at 04:35 PM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',51,217,'2025-05-23 19:30:03','2025-05-23 19:30:03','IN_APP',NULL),(506,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/26/2025 at 11:10:32 AM. Duration: 50 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,219,'2025-05-26 05:40:39','2025-05-26 05:40:39','IN_APP',NULL),(507,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/26/2025 at 11:10:32 AM. Duration: 50 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-26 05:40:39','2025-05-26 05:40:39','IN_APP',NULL),(508,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 11:25:43 AM. Duration: 180 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-26 05:55:49','2025-05-26 05:55:49','IN_APP',NULL),(509,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 11:25:43 AM. Duration: 180 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,219,'2025-05-26 05:55:49','2025-05-26 05:55:49','IN_APP',NULL),(510,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/26/2025 at 2:29:14 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,219,'2025-05-26 08:59:20','2025-05-26 08:59:20','IN_APP',NULL),(511,'New Workshop Scheduled: Sharpen Your Focus: Mastering the Art of Deep Work','A new workshop \"Sharpen Your Focus: Mastering the Art of Deep Work\" has been scheduled for 5/26/2025 at 2:29:14 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-26 08:59:20','2025-05-26 08:59:20','IN_APP',NULL),(512,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 2:31:04 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-26 09:01:08','2025-05-26 09:01:08','IN_APP',NULL),(513,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 2:31:04 PM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,219,'2025-05-26 09:01:08','2025-05-26 09:01:08','IN_APP',NULL),(514,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 2:34:30 PM. Duration: 60 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,218,'2025-05-26 09:04:35','2025-05-26 09:04:35','IN_APP',NULL),(515,'New Workshop Scheduled: Workshop by Bitroot','A new workshop \"Workshop by Bitroot\" has been scheduled for 5/26/2025 at 2:34:30 PM. Duration: 60 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',51,219,'2025-05-26 09:04:35','2025-05-26 09:04:35','IN_APP',NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `option_text` varchar(255) NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `points` decimal(2,1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=565 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `options`
--

LOCK TABLES `options` WRITE;
/*!40000 ALTER TABLE `options` DISABLE KEYS */;
INSERT INTO `options` VALUES (28,11,'Rarely',1,NULL),(29,11,'Sometimes',0,NULL),(30,11,'Often',0,NULL),(31,11,'Almost always',0,NULL),(32,12,'Happy and content',1,NULL),(33,12,'Neutral',0,NULL),(34,12,'Anxious or worried',0,NULL),(35,12,'Sad or depressed',0,NULL),(36,13,'Exercise or physical activity',1,NULL),(37,13,'Talking to a friend or therapist',0,NULL),(38,13,'Avoiding the problem',0,NULL),(39,13,'Using substances (alcohol, drugs, etc.)',0,NULL),(40,14,'Never',1,NULL),(41,14,'Occasionally',0,NULL),(42,14,'Frequently',0,NULL),(43,14,'Always',0,NULL),(44,15,'Never',1,NULL),(45,15,'Sometimes',0,NULL),(46,15,'Often',0,NULL),(47,15,'Always',0,NULL),(48,16,'Listening to music',1,NULL),(49,16,'Meditation or mindfulness',0,NULL),(50,16,'Eating comfort food',0,NULL),(51,16,'Socializing with friends',0,NULL),(52,17,'Rarely',0,NULL),(53,17,'Sometimes',0,NULL),(54,17,'Frequently',0,NULL),(55,17,'Almost always',0,NULL),(56,18,'Social interactions',0,NULL),(57,18,'Public speaking',0,NULL),(58,18,'Work deadlines',0,NULL),(59,18,'Unexpected changes',0,NULL),(60,19,'No',0,NULL),(61,19,'Mild symptoms',0,NULL),(62,19,'Moderate symptoms',0,NULL),(63,19,'Severe symptoms',0,NULL),(64,20,'Distracting myself',0,NULL),(65,20,'Talking to someone',0,NULL),(66,20,'Avoiding the situation',0,NULL),(67,20,'Using relaxation techniques',0,NULL),(68,21,'Never',0,NULL),(69,21,'Occasionally',0,NULL),(70,21,'Frequently',0,NULL),(71,21,'Always',0,NULL),(72,22,'Breathing exercises',0,NULL),(73,22,'Yoga or stretching',0,NULL),(74,22,'Journaling',0,NULL),(75,22,'None of the above',0,NULL),(100,29,'Rarely',0,NULL),(101,29,'Sometimes',0,NULL),(102,29,'Often',0,NULL),(103,29,'Almost always',0,NULL),(104,30,'Work-related pressure',0,NULL),(105,30,'Personal relationships',0,NULL),(106,30,'Financial worries',0,NULL),(107,30,'Health concerns',0,NULL),(108,31,'Remain calm and find solutions',0,NULL),(109,31,'Get anxious but manage it',0,NULL),(110,31,'Feel overwhelmed and struggle',0,NULL),(111,31,'Completely shut down',0,NULL),(112,32,'Meditation or deep breathing',0,NULL),(113,32,'Exercise or yoga',0,NULL),(114,32,'Listening to music or reading',0,NULL),(115,32,'None of the above',0,NULL),(116,33,'Never',0,NULL),(117,33,'Occasionally',0,NULL),(118,33,'Frequently',0,NULL),(119,33,'Always',0,NULL),(120,34,'Time management strategies',0,NULL),(121,34,'Therapy or counseling',0,NULL),(122,34,'Support from friends or family',0,NULL),(123,34,'Lifestyle changes (diet, exercise)',0,NULL),(178,52,'Never',0,NULL),(179,52,'Sometimes',0,NULL),(180,52,'Frequently',0,NULL),(181,52,'Almost always',0,NULL),(182,53,'Work deadlines',0,NULL),(183,53,'Personal time and hobbies',0,NULL),(184,53,'Family commitments',1,NULL),(185,53,'Health and fitness',0,NULL),(186,54,'Never',1,NULL),(187,54,'Occasionally',0,NULL),(188,54,'Frequently',0,NULL),(189,54,'Always',0,NULL),(190,55,'Spending time with family',1,NULL),(191,55,'Engaging in hobbies',0,NULL),(192,55,'Watching TV or gaming',0,NULL),(193,55,'I rarely have time to unwind',0,NULL),(374,92,'Never',0,4.0),(375,92,'Occasionally',0,3.0),(376,92,'Frequently',0,2.0),(377,92,'Almost always',0,1.0),(378,93,'Not at all',0,4.0),(379,93,'Somewhat',0,3.0),(380,93,'Quite a bit',0,2.0),(381,93,'Completely',0,1.0),(382,94,'Talking to friends or family',0,4.0),(383,94,'Engaging in a hobby',0,3.0),(384,94,'Sleeping more than usual',0,2.0),(385,94,'Withdrawing from social activities',0,1.0),(386,95,'Never',0,4.0),(387,95,'Sometimes',0,3.0),(388,95,'Most of the time',0,2.0),(389,95,'Always',0,1.0),(390,96,'Never',0,4.0),(391,96,'Occasionally',0,3.0),(392,96,'Frequently',0,2.0),(393,96,'Always',0,1.0),(394,97,'Changes in appetite',0,4.0),(395,97,'Feeling worthless or guilty',0,3.0),(396,97,'Trouble sleeping',0,2.0),(397,97,'None of the above',0,1.0),(490,122,'Option 1',0,3.0),(491,122,'Option 2',0,2.0),(492,122,'Option 3',0,1.0),(509,127,'Option 1',0,4.0),(510,127,'Option 2',0,3.0),(511,127,'Option 3',0,2.0),(512,127,'Option 4',0,1.0),(513,128,'Option 1',0,4.0),(514,128,'Option 2',0,3.0),(515,128,'Option 3',0,2.0),(516,128,'Option 4',0,1.0),(529,133,'Option 1',0,3.0),(530,133,'Option 2',0,2.0),(531,133,'Option 3',0,1.0),(532,134,'Option 1',0,3.0),(533,134,'Option 2',0,2.0),(534,134,'Option 3',0,1.0),(535,135,'Option 1',0,5.0),(536,135,'Option 2',0,4.0),(537,135,'Option 3',0,3.0),(538,135,'Option 4',0,2.0),(539,135,'Option 5',0,1.0),(540,136,'Option 1',0,5.0),(541,136,'Option 2',0,4.0),(542,136,'Option 3',0,3.0),(543,136,'Option 4',0,2.0),(544,136,'Option 5',0,1.0),(545,137,'Never',0,4.0),(546,137,'Rarely',0,3.0),(547,137,'Sometime',0,2.0),(548,137,'Often',0,1.0),(549,138,'I quickly recover and move forward',0,4.0),(550,138,'I reflect but remain optimistic',0,3.0),(551,138,'I struggle to stay positive',0,2.0),(552,138,'I feel discouraged for a long time',0,1.0),(553,139,'Never',0,4.0),(554,139,'Occasionaly',0,3.0),(555,139,'Sometime',0,2.0),(556,139,'Often',0,1.0),(557,140,'Never',0,4.0),(558,140,'Rarely',0,3.0),(559,140,'Sometime',0,2.0),(560,140,'Often',0,1.0),(561,141,'Very satisfied',0,4.0),(562,141,'Somewhat satisfied',0,3.0),(563,141,'Not very satisfied',0,2.0),(564,141,'Dissatisfied',0,1.0);
/*!40000 ALTER TABLE `options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qna`
--

DROP TABLE IF EXISTS `qna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qna` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` longtext NOT NULL,
  `answer` longtext NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qna`
--

LOCK TABLES `qna` WRITE;
/*!40000 ALTER TABLE `qna` DISABLE KEYS */;
INSERT INTO `qna` VALUES (7,'How do I get started with Neure on the dashboard?','After receiving access from your HR or admin via email, simply follow the steps to create your profile. Once set up, you’ll have full access to the dashboard, including the Workshop Section for well-being courses, the Resource Section with articles and exclusive content, soundscapes to boost focus, and a rewards program for good engagement. You’ll also complete assessments every 15 days to track your progress, with notifications from Neure to keep you updated on everything. You’re now ready to get started with Neure!',1,'2025-02-27 04:51:35','2025-05-02 10:42:49'),(8,'How are the workshops designed, and will they be relevant to my needs?','The workshops are designed based on the assessments you complete, ensuring they are tailored to your specific needs. To make sure the workshops are as relevant and beneficial as possible, it’s important to be extremely truthful during the assessments. This helps us create a personalized experience that aligns with your goals and well-being.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(9,'Is my data secure on the Neure Dashboard?','Yes, your data is fully secure on the Neure Dashboard. We adhere to the highest standards of data protection and privacy, employing robust security measures to safeguard your personal information. All data is handled with the utmost confidentiality and is used solely to personalize your experience. Rest assured, we are committed to ensuring the integrity and security of your information at all times.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(10,'What should I do if I need technical support or encounter issues on the dashboard?','If you encounter any technical issues or require support on the Neure Dashboard, you can notify your admin, who will assist you. Alternatively, you can reach out to us directly via email at the address provided below, and our support team will promptly address your concerns.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(11,'How can I earn rewards or recognition for completing workshops or activities?','Rewards and recognition for completing workshops or activities are managed by your admin. They will receive all the redeemable rewards on their portal and distribute them to individual users based on engagement levels and attendance throughout the programs. The admin has complete control over this process, ensuring that rewards are allocated fairly and appropriately.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(12,'What should I do if I forget my password or need to reset my account details?','If you forget your password or need to reset your account details, simply click on the “Forgot Password” link on the login page. Follow the instructions to reset your password securely. If you need further assistance or encounter any issues, please reach out to your admin or contact our support team via email for additional help.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(13,'How do I get notified about new workshops, updates, or events on Neure?','You will receive notifications directly from Neure about new workshops, updates, and events. These notifications will be sent to you via email and within the dashboard, ensuring you’re always informed about the latest offerings and important announcements. Pro Tip: Enable desktop notifications to never miss anything.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35'),(14,'Are there any resources or materials I can download for offline use?','Yes, all content and resources are available for download directly through the dashboard, allowing you to access them offline. However, worksheets provided during the workshop will only be available for download after the workshop concludes.',1,'2025-02-27 04:51:35','2025-02-27 04:51:35');
/*!40000 ALTER TABLE `qna` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('single_choice','multiple_choice') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_id` (`assessment_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (11,7,'How often do you feel overwhelmed with daily tasks?','single_choice'),(12,7,'Which of the following best describes your recent mood?','single_choice'),(13,7,'How do you usually cope with stress? (Select all that apply)','multiple_choice'),(14,7,'Do you have trouble sleeping due to stress or anxiety?','single_choice'),(15,7,'How often do you feel socially isolated or lonely?','single_choice'),(16,7,'Which activities help improve your mood? (Select all that apply)','multiple_choice'),(17,8,'How often do you feel nervous or on edge?','single_choice'),(18,8,'What situations make you feel the most anxious? (Select all that apply)','multiple_choice'),(19,8,'Do you experience physical symptoms when anxious?','single_choice'),(20,8,'How do you usually deal with anxious thoughts?','multiple_choice'),(21,8,'Do you have difficulty concentrating due to anxiety?','single_choice'),(22,8,'Which of these relaxation techniques have you tried? (Select all that apply)','multiple_choice'),(29,10,'How frequently do you feel stressed?','single_choice'),(30,10,'What are your common stress triggers? (Select all that apply)','multiple_choice'),(31,10,'How do you typically respond to stressful situations?','single_choice'),(32,10,'What relaxation techniques have you used? (Select all that apply)','multiple_choice'),(33,10,'Do you experience physical symptoms due to stress?','single_choice'),(34,10,'Which of the following do you believe would help reduce your stress? (Select all that apply)','multiple_choice'),(52,11,'How often do you work outside of office hours?','single_choice'),(53,11,'What do you prioritize when making a schedule? (Select all that apply)','multiple_choice'),(54,11,'Do you feel like work negatively impacts your personal life?','single_choice'),(55,11,'How do you unwind after work? (Select all that apply)','multiple_choice'),(92,9,'How often do you feel sad or hopeless?','single_choice'),(93,9,'Have you lost interest in activities you once enjoyed?','single_choice'),(94,9,'What are your common coping mechanisms? (Select all that apply)','single_choice'),(95,9,'How often do you experience fatigue even after resting?','single_choice'),(96,9,'Do you have trouble concentrating or making decisions?','single_choice'),(97,9,'Which symptoms have you experienced in the past month? (Select all that apply)','single_choice'),(122,28,'PSI test','single_choice'),(127,26,'Test with points and range','single_choice'),(128,26,'Test with points and rangeewwwe','single_choice'),(133,29,'test PSI for new range','single_choice'),(134,29,'test PSI for new rangeewe3w3e','single_choice'),(135,30,'hello from neure','single_choice'),(136,30,'hello from neure','single_choice'),(137,31,'How often do you feel overwhelmed by your responsibilities?','single_choice'),(138,31,'When faced with a setback, how do you usually react?','single_choice'),(139,31,'How often do you feel anxious or tense without a clear reason?','single_choice'),(140,31,'How often do you feel disconnected from people around you?','single_choice'),(141,31,'How satisfied are you with your current mental health and well-being?','single_choice');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `refresh_tokens_ibfk_1` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=981 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (619,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwMDM1MzUsImV4cCI6MTc0NjYwODMzNX0.T-_7moNULkehVgkBymNomyAzjLnEsJi5F6GIJuD7v2g','2025-05-07 08:58:56','2025-04-30 08:58:55'),(620,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwMDM1MzYsImV4cCI6MTc0NjYwODMzNn0.y8NimavUn3w7QJqrasTlh4HF-TVmLM65JOdc0ZQU9IE','2025-05-07 08:58:57','2025-04-30 08:58:56'),(621,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjAwODAzMywiZXhwIjoxNzQ2NjEyODMzfQ.Pcf63GZiL-YFA3_oJBW2DH9vDOwlgWRbruja6IB41Cc','2025-05-07 15:43:53','2025-04-30 10:13:53'),(622,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjAxMDY3NCwiZXhwIjoxNzQ2NjE1NDc0fQ.EmVHfEseJrgmz85ksNRCGJRrqreUHalqDrdcRFa4qlQ','2025-05-07 16:27:54','2025-04-30 10:57:54'),(623,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjAxNTgxOCwiZXhwIjoxNzQ2NjIwNjE4fQ.GLamCRLkbEmKeUhgLaxNtQCXl2agcV6BG0lp7-Ni7BQ','2025-05-07 12:23:38','2025-04-30 12:23:38'),(624,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjAxNTg1NiwiZXhwIjoxNzQ2NjIwNjU2fQ.B1HpPO__bAESMKM5WvRf-H3iQuMjMQDSSG66qFScJyU','2025-05-07 12:24:17','2025-04-30 12:24:16'),(625,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjA4MzczNSwiZXhwIjoxNzQ2Njg4NTM1fQ.hCUsLitGRuvG-00sd2PwWXzumO-8XH_y8HORE_D_Xhc','2025-05-08 07:15:36','2025-05-01 07:15:35'),(626,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjA4OTAwOSwiZXhwIjoxNzQ2NjkzODA5fQ.l8zEonjv9wQg_4CrpmGyo7e7VQMLWYnbTs1-88I7qY4','2025-05-08 08:43:30','2025-05-01 08:43:29'),(627,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTIzNzQsImV4cCI6MTc0NjY5NzE3NH0.4cmKoiLxbv36xNRyvAT51K73eNoaj6_LL-QR5jHBVdY','2025-05-08 09:39:34','2025-05-01 09:39:34'),(628,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTIzNzYsImV4cCI6MTc0NjY5NzE3Nn0.6LDKiQMm5IhNg-eQvuTt7lrC-nl8UN3WPuf0l4dH9b4','2025-05-08 09:39:36','2025-05-01 09:39:36'),(629,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTQ5NzUsImV4cCI6MTc0NjY5OTc3NX0.GPq0fqYpGnT8qc4qR_0O4b0w08ravaMXQf5sizxVtMc','2025-05-08 10:22:56','2025-05-01 10:22:55'),(630,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTQ5NzYsImV4cCI6MTc0NjY5OTc3Nn0.YtS7_1mVq37XH1qG22459K3PmteKsAXUptl5mhqyPx0','2025-05-08 10:22:56','2025-05-01 10:22:56'),(631,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTMsImV4cCI6MTc0Njc2NzgxM30.30y3AHu-AhdGlhuln2Md9UJyHsIijuaPh6ZYKAG09Nw','2025-05-09 05:16:53','2025-05-02 05:16:53'),(632,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTQsImV4cCI6MTc0Njc2NzgxNH0.oHXZ7i28XcT9qgWjAH6dydDLlmByMRi0J9z2544ayJ0','2025-05-09 05:16:54','2025-05-02 05:16:54'),(633,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTUsImV4cCI6MTc0Njc2NzgxNX0.ya8URPeISjxEgHoZ4gh_FiF-MH3GEuUZpd4Xb6_MJGU','2025-05-09 05:16:55','2025-05-02 05:16:55'),(634,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2MzA5NCwiZXhwIjoxNzQ2NzY3ODk0fQ.htRzCvRPv_3U0zWSxskEt7xpd74-VPTpJcK9uzcIbm8','2025-05-09 05:18:14','2025-05-02 05:18:14'),(635,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2MzEzOCwiZXhwIjoxNzQ2NzY3OTM4fQ.2qt6CpKZ4lJo3HLYyy2OQVXztwfIXsXFqZ9J7Pxa13s','2025-05-09 05:18:58','2025-05-02 05:18:58'),(636,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjQ4ODUsImV4cCI6MTc0Njc2OTY4NX0.Rc4HFshK_AwR2SV8i1_DTsWuwveGi0eSexlT7IbIzpw','2025-05-09 05:48:06','2025-05-02 05:48:05'),(637,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjE2NTEyMCwiZXhwIjoxNzQ2NzY5OTIwfQ.YeVVx7KqM3-ulV9wRXqx7YZ0Q2DU0mSnJj6V7HUKX0Q','2025-05-09 05:52:00','2025-05-02 05:52:00'),(638,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2OTU2OCwiZXhwIjoxNzQ2Nzc0MzY4fQ.1fpkTLM_eoAZ3UmJaKQVtS5T8mtdMC-ot_5gujkjWBg','2025-05-09 07:06:08','2025-05-02 07:06:08'),(639,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE4MTA5OCwiZXhwIjoxNzQ2Nzg1ODk4fQ.7r-xlFeXKt6vLY_NBZMd-Z9QS2eM0rQyh7_ttyIPjiw','2025-05-09 15:48:19','2025-05-02 10:18:18'),(640,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxODMzODMsImV4cCI6MTc0Njc4ODE4M30.wuWv9n8AEmo0PFYd1pqpe6f8FfTCa50YNe-uwXXLaso','2025-05-09 16:26:24','2025-05-02 10:56:23'),(641,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjE4NDM1OSwiZXhwIjoxNzQ2Nzg5MTU5fQ.SbbsEZ_ee9t9svQrpEinNauqxNNSDQLP-2mOWP1cB5Q','2025-05-09 16:42:40','2025-05-02 11:12:39'),(642,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjI1NDMyNywiZXhwIjoxNzQ2ODU5MTI3fQ.XgGhQZYUOWaXofonhGIdl8qdfosXGLkUXJ6TnTkgDTg','2025-05-10 06:38:48','2025-05-03 06:38:48'),(643,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYyNzgzMzksImV4cCI6MTc0Njg4MzEzOX0.qGg-yssGLmgOO3eKMGIf2KbNPFr2xzh2nySXmzjDam0','2025-05-10 13:19:00','2025-05-03 13:19:00'),(644,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYyNzgzNDAsImV4cCI6MTc0Njg4MzE0MH0.W201KXTOI2PU1rNe2DRvmtWY4YsjGGgLPkyHWt9K-Qs','2025-05-10 13:19:00','2025-05-03 13:19:00'),(645,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjA3MzUsImV4cCI6MTc0NzAyNTUzNX0.3hGOfgS-02uqdBpy4BmE1y8_SUuBBfqAwb5iHN48mh4','2025-05-12 10:22:16','2025-05-05 04:52:15'),(646,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMTg3MCwiZXhwIjoxNzQ3MDI2NjcwfQ.VJy710v8cJBqps385vQmfhM4pJIdQh5DGM-1UalI34c','2025-05-12 10:41:11','2025-05-05 05:11:10'),(647,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyMjQ0OSwiZXhwIjoxNzQ3MDI3MjQ5fQ.MOyZsCBz7pvhfT2Iry2p942EztqMonywbWxfijwMgDk','2025-05-12 10:50:50','2025-05-05 05:20:49'),(648,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMjQ4OCwiZXhwIjoxNzQ3MDI3Mjg4fQ.llCUflTp49YPLI2BVNfL9i_9pIAcmc4MKZMyrbWXW8c','2025-05-12 10:51:28','2025-05-05 05:21:28'),(649,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMzM3MywiZXhwIjoxNzQ3MDI4MTczfQ.iRV_Q3lZfWbboUqa5QLsuz-sDzIBDR86mlFpG0r4GbI','2025-05-12 11:06:14','2025-05-05 05:36:13'),(650,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyMzY0NywiZXhwIjoxNzQ3MDI4NDQ3fQ.BU64OZ-l2cYD1p0oT71_nfS82wfjF_8Clm-jVRSgDFw','2025-05-12 11:10:48','2025-05-05 05:40:47'),(651,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyNjM1MSwiZXhwIjoxNzQ3MDMxMTUxfQ.SO4XktdscLVKFYnLzQK5N076W-cr0m6U6-5eQK0nzvc','2025-05-12 06:25:51','2025-05-05 06:25:51'),(652,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyNzgzMCwiZXhwIjoxNzQ3MDMyNjMwfQ.AwWNguPeHPvpEidXYhpdt_sM0mWk4QY3-p54PfSzEis','2025-05-12 12:20:30','2025-05-05 06:50:30'),(653,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjkyNjksImV4cCI6MTc0NzAzNDA2OX0.wBh5Ps-WEHl1Z0XZjVDFB1cQwNffY8CD7uEV3f8RQLw','2025-05-12 07:14:30','2025-05-05 07:14:29'),(654,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjkyNjksImV4cCI6MTc0NzAzNDA2OX0.wBh5Ps-WEHl1Z0XZjVDFB1cQwNffY8CD7uEV3f8RQLw','2025-05-12 07:14:30','2025-05-05 07:14:29'),(655,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQzMDg3MiwiZXhwIjoxNzQ3MDM1NjcyfQ.sLFVlVq3braISnqP06TA6fgIlmKHTPkMPPO9genP1gI','2025-05-12 07:41:12','2025-05-05 07:41:12'),(656,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjUsImV4cCI6MTc0NzAzNzM2NX0.qBje_dRz7m3QpBK4q8xKz0CxwwfuCSjPI87n08eHeYs','2025-05-12 13:39:25','2025-05-05 08:09:25'),(657,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjYsImV4cCI6MTc0NzAzNzM2Nn0.94HRowkkOrmOYY2-5qHZjQjriOUmQMGdxiX9SFcv7L4','2025-05-12 13:39:26','2025-05-05 08:09:26'),(658,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjYsImV4cCI6MTc0NzAzNzM2Nn0.94HRowkkOrmOYY2-5qHZjQjriOUmQMGdxiX9SFcv7L4','2025-05-12 13:39:26','2025-05-05 08:09:26'),(659,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0Mzg3NzMsImV4cCI6MTc0NzA0MzU3M30.nbWtw30HmD3a6sLiuo9fJNp2zIKbGbiBvJSQzzEpyiI','2025-05-12 09:52:54','2025-05-05 09:52:53'),(660,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0Mzg3NzQsImV4cCI6MTc0NzA0MzU3NH0.1a8o3f4QFEMCQW8s3Ce1xeIx1G2BrdGsBXhghD9cbq0','2025-05-12 09:52:54','2025-05-05 09:52:54'),(661,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzkxNjQsImV4cCI6MTc0NzA0Mzk2NH0.fPdPFkWdkpj8KmR1O-Xv6joB8duLwX84_6K_6upxsyQ','2025-05-12 09:59:25','2025-05-05 09:59:24'),(662,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzkxNjUsImV4cCI6MTc0NzA0Mzk2NX0.14RoZg-fOLTVBCHBIAxU2xt_ET63f5Oh862GY7Rp0Ao','2025-05-12 09:59:25','2025-05-05 09:59:25'),(663,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0NDU3NDcsImV4cCI6MTc0NzA1MDU0N30.HVSAvsQYymUkfjmMZ8bPRC4toa23aobknBUSPUgo2t0','2025-05-12 17:19:07','2025-05-05 11:49:07'),(664,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQ0Njk0OSwiZXhwIjoxNzQ3MDUxNzQ5fQ.30r64IH23V5-ZX-rpTEVPe98sHh8PMpWy4_mEOk2BX4','2025-05-12 17:39:10','2025-05-05 12:09:09'),(665,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQ0ODI5OSwiZXhwIjoxNzQ3MDUzMDk5fQ.hd4KfpILGyvIdgT3YolGznw1hAvn--hibhevMFZUrb4','2025-05-12 18:01:39','2025-05-05 12:31:39'),(666,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MDQ3NTMsImV4cCI6MTc0NzEwOTU1M30.2q3UvBqsABGq2DvkYq1WtOM70U7CJebFw7aERMmI_pU','2025-05-13 09:42:34','2025-05-06 04:12:33'),(667,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNTcxNywiZXhwIjoxNzQ3MTEwNTE3fQ.mitOg2vQS13WdZy1f-GiUUfvStym3q-D47FpzG66528','2025-05-13 04:28:37','2025-05-06 04:28:37'),(668,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNjEwNiwiZXhwIjoxNzQ3MTEwOTA2fQ.TRAdFyFuZlCGvIpE5TugN5ZbCqyQqY6Rr6_WBqDPZns','2025-05-13 10:05:06','2025-05-06 04:35:06'),(669,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNjMyMiwiZXhwIjoxNzQ3MTExMTIyfQ.Bw3mExnyTVEOdgtMPwW-Ncc4s99CY8Oi_1rUDkFu5SE','2025-05-13 10:08:43','2025-05-06 04:38:42'),(670,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUwODAzNSwiZXhwIjoxNzQ3MTEyODM1fQ.8IosQ-7b7JOzxcFQnCP9vZ_WP-ALAGVzyEQj9wlUME0','2025-05-13 10:37:15','2025-05-06 05:07:15'),(671,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUyMjg0NiwiZXhwIjoxNzQ3MTI3NjQ2fQ.DFCwung4Yuu8xlsG8L55tNgnkfMJjiRiCgjmFlKBRoY','2025-05-13 09:14:07','2025-05-06 09:14:06'),(672,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUyMjg3OSwiZXhwIjoxNzQ3MTI3Njc5fQ.pmi5Gh3GrlIEVexvG_0Htgnkdev3uz8aZHTOQIv2_uc','2025-05-13 14:44:39','2025-05-06 09:14:39'),(673,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUyNTE0NCwiZXhwIjoxNzQ3MTI5OTQ0fQ.MEUMEL8mRCyLII5QjmeSpls0h3Sf-tTbrafxWwo9usU','2025-05-13 09:52:24','2025-05-06 09:52:24'),(674,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1Mjg3MDQsImV4cCI6MTc0NzEzMzUwNH0.e84crC2563JPNY38fCNTkah8UcSQJO2GrtcroUL1cVo','2025-05-13 10:51:44','2025-05-06 10:51:44'),(675,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1Mjg3MDQsImV4cCI6MTc0NzEzMzUwNH0.e84crC2563JPNY38fCNTkah8UcSQJO2GrtcroUL1cVo','2025-05-13 10:51:44','2025-05-06 10:51:44'),(676,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkwNDEsImV4cCI6MTc0NzEzMzg0MX0.cN8jPD2aa6Qt7quYfMZIzcdQ0xfbVCjp-1jBmLwydf4','2025-05-13 16:27:21','2025-05-06 10:57:21'),(677,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDgsImV4cCI6MTc0NzEzNDE0OH0.A3isy_-HsWxYnVJuU81qrgwxHPnBIeFXwy-zSmwnMbc','2025-05-13 11:02:28','2025-05-06 11:02:28'),(678,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDgsImV4cCI6MTc0NzEzNDE0OH0.A3isy_-HsWxYnVJuU81qrgwxHPnBIeFXwy-zSmwnMbc','2025-05-13 11:02:28','2025-05-06 11:02:28'),(679,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDksImV4cCI6MTc0NzEzNDE0OX0.-AtC28GgLkGI0oIdkdVVPeikJzAqocHL_kO06A5Ff_g','2025-05-13 11:02:29','2025-05-06 11:02:29'),(680,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUzMDc5MCwiZXhwIjoxNzQ3MTM1NTkwfQ.8k7SqY9MZ7fj7NfP35RcJwUBdKNGTL0ubR2esH57Rxk','2025-05-13 16:56:31','2025-05-06 11:26:30'),(681,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NTcyNzYsImV4cCI6MTc0NzE2MjA3Nn0.U6r960XKrRCA8ISxb8ufzYkhxl3i77h2Mf9uzp-4OVo','2025-05-13 18:47:56','2025-05-06 18:47:56'),(682,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NTcyNzYsImV4cCI6MTc0NzE2MjA3Nn0.U6r960XKrRCA8ISxb8ufzYkhxl3i77h2Mf9uzp-4OVo','2025-05-13 18:47:56','2025-05-06 18:47:56'),(683,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:39','2025-05-06 19:59:39'),(684,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:39','2025-05-06 19:59:39'),(685,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:40','2025-05-06 19:59:39'),(686,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjI1NTcsImV4cCI6MTc0NzE2NzM1N30.8F5zhDYQUs40JfTykPjmYQce1fEuD4JO3C6omVR6Tj4','2025-05-13 20:15:58','2025-05-06 20:15:57'),(687,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjI1NTcsImV4cCI6MTc0NzE2NzM1N30.8F5zhDYQUs40JfTykPjmYQce1fEuD4JO3C6omVR6Tj4','2025-05-13 20:15:58','2025-05-06 20:15:58'),(688,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTIxNTEsImV4cCI6MTc0NzE5Njk1MX0.466E0EQWeUmUBZxx_eLrkIUx4YyYUtNZby5IHmNuiTs','2025-05-14 04:29:12','2025-05-07 04:29:11'),(689,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTIxNTIsImV4cCI6MTc0NzE5Njk1Mn0.dEExiLTB6KYejv7-9m-ZA9RzanmomhRV4uYCs33oonY','2025-05-14 04:29:12','2025-05-07 04:29:12'),(690,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTU5OTMsImV4cCI6MTc0NzIwMDc5M30.WHQNKLI9Xxvs7Bi8iiH6eQP8JqLDki5v4_wltBZm3dU','2025-05-14 05:33:14','2025-05-07 05:33:13'),(691,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTg4NDAsImV4cCI6MTc0NzIwMzY0MH0.cWZzm-N5MwJZU-SOJYogQnfodbvlvnpPIvskngZuYtQ','2025-05-14 06:20:41','2025-05-07 06:20:40'),(692,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzMsImV4cCI6MTc0NzIwNDEzM30.WZ85bQKKQGZJe79JxCfd4IzluGVYgYUQ13yyRlHP_XU','2025-05-14 06:28:54','2025-05-07 06:28:54'),(693,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzcsImV4cCI6MTc0NzIwNDEzN30.UdRT4ew5Z8a5DMgaQS7TpiWZk_yKBbzs1ON-Lr3ktyE','2025-05-14 06:28:58','2025-05-07 06:28:57'),(694,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzgsImV4cCI6MTc0NzIwNDEzOH0.gUUFVRTD80Ml91O5Qv86J1k11qEggvli7prXsc5bSXU','2025-05-14 06:28:58','2025-05-07 06:28:58'),(695,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzksImV4cCI6MTc0NzIwNDEzOX0.I_aJHUIttrOjXfSuiPKmjCSwWyYmYyVH26T8tRdkk2M','2025-05-14 06:28:59','2025-05-07 06:28:59'),(696,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzIzMywiZXhwIjoxNzQ3MjA4MDMzfQ.NP2-sGNmCYqM_GU71LNQUaw5jyPzEr7209EKJ1c1YHo','2025-05-14 07:33:54','2025-05-07 07:33:53'),(697,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzI2MywiZXhwIjoxNzQ3MjA4MDYzfQ.sGWG2xldC3ZH3QFQYXkAm5nDk68kJhGuKxlc1lXNxWI','2025-05-14 07:34:24','2025-05-07 07:34:23'),(698,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzI5NiwiZXhwIjoxNzQ3MjA4MDk2fQ.uXxLIGm6FbCOuotaagjtuK03HcW-dR7rafDWz7rE_c4','2025-05-14 07:34:57','2025-05-07 07:34:56'),(699,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzMyMywiZXhwIjoxNzQ3MjA4MTIzfQ.ry2llJUMrRcidsIivvPB-wMXSZy33koJ-TmKFPLaSWI','2025-05-14 07:35:23','2025-05-07 07:35:23'),(700,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzMzNCwiZXhwIjoxNzQ3MjA4MTM0fQ.WdQRA1aMqr9P_DqaGEmN9-tYTMhX3vVUWXPB5LUtvJU','2025-05-14 07:35:35','2025-05-07 07:35:35'),(701,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzM1MSwiZXhwIjoxNzQ3MjA4MTUxfQ.lNgKUNakYztNG4SNFmOFWNAEmbLJu5ry-nW3QJ4txTY','2025-05-14 07:35:51','2025-05-07 07:35:51'),(702,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzQyMSwiZXhwIjoxNzQ3MjA4MjIxfQ.yiybp4X6RTHe4xYXFbsDrZMv61BPXm8GpNvM8ap96Ms','2025-05-14 07:37:01','2025-05-07 07:37:01'),(703,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwMzUyMSwiZXhwIjoxNzQ3MjA4MzIxfQ.tZVlrhfEwQeq9528ApSkPAwwu3bHJ90CSmmPwSgccls','2025-05-14 07:38:41','2025-05-07 07:38:41'),(704,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MDQyNDgsImV4cCI6MTc0NzIwOTA0OH0.-AiHQFcSAsYr-aPkMNvE0xkuSgsH0LCMy_Gm7l7PDpk','2025-05-14 13:20:49','2025-05-07 07:50:48'),(705,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYwNDkwOCwiZXhwIjoxNzQ3MjA5NzA4fQ.NpTlgeB7pJsbD1gDs5GYmiLwsXQbm8LudM6O-jnnxp8','2025-05-14 08:01:48','2025-05-07 08:01:48'),(706,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MDUyMjAsImV4cCI6MTc0NzIxMDAyMH0.I8yQ16qWwBKkZQ5ZyzAuOOV1rTwaGhO3hrQ2DJ1T11U','2025-05-14 08:07:00','2025-05-07 08:07:00'),(707,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MDUyMzEsImV4cCI6MTc0NzIxMDAzMX0.xqsvSli0KYgLjLAHHj-fjxw3wFGsYaDWlMumB9OhurM','2025-05-14 08:07:11','2025-05-07 08:07:11'),(708,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYwNzUyNSwiZXhwIjoxNzQ3MjEyMzI1fQ.XDpdnzTNBXiAcvOwmNHg9fasgHABA6xp3sstnlBslbY','2025-05-14 08:45:25','2025-05-07 08:45:25'),(709,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYwNzYxMywiZXhwIjoxNzQ3MjEyNDEzfQ.zmdtLa6PrZ2ipHN067sQZdSQgL9GsbZxMUrdsVCYCdE','2025-05-14 08:46:53','2025-05-07 08:46:53'),(710,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwOTY5NiwiZXhwIjoxNzQ3MjE0NDk2fQ.aAjAu-q9kp5LMkyvLoAIVi88pLKlUQ8NoT52vb3OidU','2025-05-14 09:21:36','2025-05-07 09:21:36'),(711,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYwOTc4NywiZXhwIjoxNzQ3MjE0NTg3fQ.bTLS3R3OV7E5MoPbsjMr1nZ3kLydS1RVN8Dyv33kR9c','2025-05-14 09:23:07','2025-05-07 09:23:07'),(712,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYxMDYwOSwiZXhwIjoxNzQ3MjE1NDA5fQ.83Qm2N-DxVAlL3a1kYbXjDmaigdsKJWNk06vIKmNcys','2025-05-14 09:36:50','2025-05-07 09:36:50'),(713,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYxMDYyNywiZXhwIjoxNzQ3MjE1NDI3fQ.xMZ5Yjhu5k6nntqfvhkUGz6MG-sovYKQ11UaDbIJels','2025-05-14 09:37:08','2025-05-07 09:37:07'),(714,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYxMDc2MywiZXhwIjoxNzQ3MjE1NTYzfQ.W-QFX5xeVMAuSiyh_GGJk2CCfeV5AUjX0VY4i3clEPc','2025-05-14 09:39:23','2025-05-07 09:39:23'),(715,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYxMTE0MiwiZXhwIjoxNzQ3MjE1OTQyfQ.EKoTFC01l0iC54H6lbcsBpX3mhBLFIzKVwWYuIWaaXs','2025-05-14 09:45:43','2025-05-07 09:45:42'),(716,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYxMTQ5OSwiZXhwIjoxNzQ3MjE2Mjk5fQ.vs2yDIFTPGxTzhvKBHVTv6nuhGGzik5R0sgJsHFHHoM','2025-05-14 09:51:40','2025-05-07 09:51:39'),(717,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjYxMTY4OSwiZXhwIjoxNzQ3MjE2NDg5fQ.7IiRQijB8DuhbzdKPsrrad2JGuTNLMi9oeSJTZffqW4','2025-05-14 09:54:50','2025-05-07 09:54:49'),(718,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTE3MTMsImV4cCI6MTc0NzIxNjUxM30.FK_xb0_E2PmiCdntYLPYjXYwUU0JgjojriYpw_IkjRI','2025-05-14 09:55:13','2025-05-07 09:55:13'),(719,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTE3MTQsImV4cCI6MTc0NzIxNjUxNH0.5_rGsQH0qKE2xAVxoycPeddH6JT9q97xw2wDNSE4YPM','2025-05-14 09:55:14','2025-05-07 09:55:14'),(720,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjYxMjY4NSwiZXhwIjoxNzQ3MjE3NDg1fQ.L9oC2B07vXWHVGFPMJsDIXSZtECQ6qzAr-9CtCJ0Rxc','2025-05-14 15:41:25','2025-05-07 10:11:25'),(721,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTM4MzksImV4cCI6MTc0NzIxODYzOX0.Zs9FBzA7jpQA0NiCF9RRkc9fR9KrXeKM8rmiUb9P0sg','2025-05-14 10:30:39','2025-05-07 10:30:39'),(722,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTM4NzMsImV4cCI6MTc0NzIxODY3M30.91z1X9rODIHSxfYg3Ah2xppwePHh-tI6dTUpvfgq4MI','2025-05-14 10:31:13','2025-05-07 10:31:13'),(723,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTQxMjMsImV4cCI6MTc0NzIxODkyM30.aQsVJ_gu33ALpIpjXYSyTyFjSabqD-xQy3MVThRJqek','2025-05-14 10:35:23','2025-05-07 10:35:23'),(724,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTQyMTksImV4cCI6MTc0NzIxOTAxOX0.Go3e1VaBfPD4KOB3Lqv-lvxDqH2olsQ_qordSjhiBqg','2025-05-14 10:36:59','2025-05-07 10:36:59'),(725,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2MTQyMTksImV4cCI6MTc0NzIxOTAxOX0.Go3e1VaBfPD4KOB3Lqv-lvxDqH2olsQ_qordSjhiBqg','2025-05-14 10:37:00','2025-05-07 10:36:59'),(731,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2Nzg5OTAsImV4cCI6MTc0NzI4Mzc5MH0.DPTZyar-eQ1-KfvbYH3GP5mz9dflayrPjSmQAjjj4mQ','2025-05-15 04:36:31','2025-05-08 04:36:30'),(732,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2Nzg5OTAsImV4cCI6MTc0NzI4Mzc5MH0.DPTZyar-eQ1-KfvbYH3GP5mz9dflayrPjSmQAjjj4mQ','2025-05-15 04:36:31','2025-05-08 04:36:30'),(733,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2Nzk3MjQsImV4cCI6MTc0NzI4NDUyNH0.MGzWdP_O05hqfVBk75wrgTZu0mN9dDRnO6HXLiiWno0','2025-05-15 10:18:44','2025-05-08 04:48:44'),(734,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjY4MjMxMSwiZXhwIjoxNzQ3Mjg3MTExfQ.axQDyTOVPjSm4DxDoUVf6Pkukj7ZOrNs7tCL27_9z9o','2025-05-15 11:01:51','2025-05-08 05:31:51'),(735,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjY5MTQzMywiZXhwIjoxNzQ3Mjk2MjMzfQ.npD8a_PREAIUhaDHRkYRVlcTMYcvsRm5FoRhb0geKDE','2025-05-15 13:33:53','2025-05-08 08:03:53'),(736,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTM5NzEsImV4cCI6MTc0NzI5ODc3MX0.BlxGhmiMvWLVZplflg4XMqoQFXrXKeUFoF1V6gSoQ2Y','2025-05-15 08:46:11','2025-05-08 08:46:11'),(737,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTM5NzEsImV4cCI6MTc0NzI5ODc3MX0.BlxGhmiMvWLVZplflg4XMqoQFXrXKeUFoF1V6gSoQ2Y','2025-05-15 08:46:12','2025-05-08 08:46:12'),(738,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjY5NjE0NSwiZXhwIjoxNzQ3MzAwOTQ1fQ.knTwFK_lBGbYQJdFZONb82T5fuSIzZnIE0pPudsk23g','2025-05-15 14:52:25','2025-05-08 09:22:25'),(739,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjY5NjQwMiwiZXhwIjoxNzQ3MzAxMjAyfQ.ZyP712RF1DkaXZ2vxC0-f-SCTZBJhf-6tOCORS5Ul8w','2025-05-15 14:56:43','2025-05-08 09:26:42'),(740,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTcxMTEsImV4cCI6MTc0NzMwMTkxMX0.JQ6vxzJTbYKlqfWEHl658384vJxhwXkNcDW_AkaapEM','2025-05-15 09:38:31','2025-05-08 09:38:31'),(741,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTcxMTIsImV4cCI6MTc0NzMwMTkxMn0.-_Gi0s182CK74mCwcH1l-pRqhqg26VzE-_6t5mSe9xw','2025-05-15 09:38:33','2025-05-08 09:38:32'),(742,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjY5NzE3NCwiZXhwIjoxNzQ3MzAxOTc0fQ.9-oqbKfzmm9JUzDKU-ljBLGY7MspjebiyHmyzFAGV_k','2025-05-15 09:39:34','2025-05-08 09:39:34'),(743,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjY5NzIxMCwiZXhwIjoxNzQ3MzAyMDEwfQ.R5FMfoScgvnPIgXnH767fkzjBdxzQoh0edz4swM92p8','2025-05-15 09:40:11','2025-05-08 09:40:10'),(744,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTc3MDQsImV4cCI6MTc0NzMwMjUwNH0.C4gF3gj3IIeaNPHJjX4aUugcY4paFVQ6_a1PppIp7Xg','2025-05-15 09:48:24','2025-05-08 09:48:24'),(745,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY2OTc4MDMsImV4cCI6MTc0NzMwMjYwM30.B85a9p_9crdcYH7np3V2qiEW4BHU0yFok_ftILC-z9E','2025-05-15 09:50:04','2025-05-08 09:50:03'),(746,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDAwMjMsImV4cCI6MTc0NzMwNDgyM30.dWsB9t1hmjX7E2XDYqtkub1mUlYNSeiAmOrBKcA8ZiQ','2025-05-15 10:27:04','2025-05-08 10:27:03'),(747,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDAwMjUsImV4cCI6MTc0NzMwNDgyNX0.d7imjvAorSJEMMgNo6iOkpQCRP-hHbDEz9iHaoYhF_Y','2025-05-15 10:27:05','2025-05-08 10:27:05'),(748,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjcwMDM5OCwiZXhwIjoxNzQ3MzA1MTk4fQ.UzsjCJkrd9iw5F2f5w7phJOGpbbXDdfMxyrQLMofOr4','2025-05-15 10:33:18','2025-05-08 10:33:18'),(749,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDA0ODEsImV4cCI6MTc0NzMwNTI4MX0.zqAyqmTDJjirdNKBGbY1LLlVkVI3DQvJWVmzZL07kOQ','2025-05-15 10:34:42','2025-05-08 10:34:41'),(750,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjcwMDU4OCwiZXhwIjoxNzQ3MzA1Mzg4fQ.OQ_hUBNO2Oto-6RHOAZ8jtd4e6R7FQjyS21MDC4_1y8','2025-05-15 10:36:28','2025-05-08 10:36:28'),(751,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDA3MDgsImV4cCI6MTc0NzMwNTUwOH0.oVBgQPiBcJVW1Em52TJhf0xfC9139XmuNbWTQWngNfQ','2025-05-15 10:38:29','2025-05-08 10:38:28'),(752,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDA3MDksImV4cCI6MTc0NzMwNTUwOX0.KDyyOMOw721UOlDcQq4F2AQMIZY60c-OodpLCgA2gS8','2025-05-15 10:38:30','2025-05-08 10:38:29'),(753,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDA5MDEsImV4cCI6MTc0NzMwNTcwMX0.F0fdqd8XIzK56Xmdw68EP0JYklKOkAxKSSx2rJ35DC8','2025-05-15 16:11:41','2025-05-08 10:41:41'),(754,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjcwMTA0MCwiZXhwIjoxNzQ3MzA1ODQwfQ.hoPX5SHBnxZvMkyroFoJPm_w5uHjii0CpF3GBsbst98','2025-05-15 10:44:00','2025-05-08 10:44:00'),(755,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDE1MjIsImV4cCI6MTc0NzMwNjMyMn0.tgmSwisZl1FqLiWZfIzvOQJfz6MWhQuqnDWcdV5LLz4','2025-05-15 10:52:02','2025-05-08 10:52:02'),(756,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDI5MTEsImV4cCI6MTc0NzMwNzcxMX0.5VEVn_j_uQWmmVKRy52zeyEUHftI5kExp1ZQsLQzHBE','2025-05-15 11:15:12','2025-05-08 11:15:12'),(757,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3MDI5MTIsImV4cCI6MTc0NzMwNzcxMn0.C8d6j4h5p3jm8XjGoMsGhxLdFQZKGlXtV6ZP1yTYd7Q','2025-05-15 11:15:12','2025-05-08 11:15:12'),(758,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjcwNjg5MSwiZXhwIjoxNzQ3MzExNjkxfQ.hoE4SUtW-OjPVqOGcsPuodCwq_OutWYpIL2LG2Mgxgg','2025-05-15 12:21:31','2025-05-08 12:21:31'),(759,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjcwNjk1MSwiZXhwIjoxNzQ3MzExNzUxfQ.EYzzI4hAtHDNVRq2Xjn2-0M1PGvGu87Hd73XE77gC8s','2025-05-15 12:22:31','2025-05-08 12:22:31'),(760,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc2NTMyMCwiZXhwIjoxNzQ3MzcwMTIwfQ.V7HSnDDm1R2f71niFCChNw1uA-H_Y6Y17sb1LcK3CMU','2025-05-16 04:35:20','2025-05-09 04:35:20'),(761,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njc2NDEsImV4cCI6MTc0NzM3MjQ0MX0.-He_01hJ8XW4lpDrCTSDFDXoxHIqGEWmKidavBeyR5E','2025-05-16 05:14:01','2025-05-09 05:14:01'),(762,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njc2NDEsImV4cCI6MTc0NzM3MjQ0MX0.-He_01hJ8XW4lpDrCTSDFDXoxHIqGEWmKidavBeyR5E','2025-05-16 05:14:01','2025-05-09 05:14:01'),(763,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njc2NDIsImV4cCI6MTc0NzM3MjQ0Mn0.BSNnZVtvSH2efuRwxFFgIIQlzZRS2VJFnX5_JZnMOa8','2025-05-16 05:14:02','2025-05-09 05:14:02'),(764,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc2Nzg4MCwiZXhwIjoxNzQ3MzcyNjgwfQ.0d-1zRZ9o9_lgrTx7WshhKaW4RGqrUT17QxpTykPLpA','2025-05-16 05:18:01','2025-05-09 05:18:00'),(765,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc2NzkxNiwiZXhwIjoxNzQ3MzcyNzE2fQ.f6PD5ve4ccXTwsSQ18Cs8XfZwd0dry1hppaP50gPpqo','2025-05-16 05:18:36','2025-05-09 05:18:36'),(766,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc2Nzk0NiwiZXhwIjoxNzQ3MzcyNzQ2fQ.yeppmsiY4hA78a0kWGE0_mOOECewAl3Gu-tITU175oE','2025-05-16 05:19:07','2025-05-09 05:19:06'),(767,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njg3NDgsImV4cCI6MTc0NzM3MzU0OH0.UpQ4YjPPTEhcvcpkfEKC6aZWKUtrysF4DLy4azhPMr0','2025-05-16 05:32:29','2025-05-09 05:32:28'),(768,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njg3NDksImV4cCI6MTc0NzM3MzU0OX0.xQfXlXwhZGDw0IlJ7oA7mospKNVytNWqLjSQALWD_iY','2025-05-16 05:32:30','2025-05-09 05:32:29'),(769,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3NjkwNTYsImV4cCI6MTc0NzM3Mzg1Nn0.ZYJYnpGcjDJATYS2HVKctdKc15uKRmae3xBZs9QlBWA','2025-05-16 11:07:36','2025-05-09 05:37:36'),(770,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3NjkxNTQsImV4cCI6MTc0NzM3Mzk1NH0.wfQhwh1-ltZ4ma1ab7EMha-ZSaV6arE_W4pkgfxLiNQ','2025-05-16 05:39:15','2025-05-09 05:39:14'),(771,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3Njk2NTEsImV4cCI6MTc0NzM3NDQ1MX0.hkf2pgtrBMNT-o6j7J8jrwv-AhcL5AQQce3741AEq0w','2025-05-16 05:47:31','2025-05-09 05:47:31'),(772,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3NzU1MDMsImV4cCI6MTc0NzM4MDMwM30.k52YD2A6KlJqI_nZS9UyLmqrbegTBOLOJKFktzDd5uE','2025-05-16 07:25:03','2025-05-09 07:25:03'),(773,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3NzU1MDMsImV4cCI6MTc0NzM4MDMwM30.k52YD2A6KlJqI_nZS9UyLmqrbegTBOLOJKFktzDd5uE','2025-05-16 07:25:04','2025-05-09 07:25:03'),(774,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc3NzcxMSwiZXhwIjoxNzQ3MzgyNTExfQ.TJbSzEfksxE7a9SST62XXGu1hpMbz9XwsnS2OX3t700','2025-05-16 08:01:51','2025-05-09 08:01:51'),(775,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc3ODUyNiwiZXhwIjoxNzQ3MzgzMzI2fQ.i4o-VTwibQNRI4JpZuyEKw7jjevD-JndRhPNPj57jPg','2025-05-16 08:15:26','2025-05-09 08:15:26'),(776,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc3OTIxOCwiZXhwIjoxNzQ3Mzg0MDE4fQ.34LsHiw2srsToRqjKlTTnMGLip3cGGaStSyu-mzYP3U','2025-05-16 13:56:58','2025-05-09 08:26:58'),(777,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc3OTYxNSwiZXhwIjoxNzQ3Mzg0NDE1fQ.j_Fof8pkJWQfWUsMBwG43E9m0GckVDNjp7H1p3GJd-k','2025-05-16 14:03:35','2025-05-09 08:33:35'),(778,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc3OTcyMywiZXhwIjoxNzQ3Mzg0NTIzfQ.hRv_Cp2gy_LREuoCeskBuT759CEO5PpXMdJoAfYVKU0','2025-05-16 14:05:23','2025-05-09 08:35:23'),(779,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3ODE5OTIsImV4cCI6MTc0NzM4Njc5Mn0.i9IsS9zBX2Ac7m4ejifgj7NbVzqW8HbGbwdh394Nc9A','2025-05-16 09:13:12','2025-05-09 09:13:12'),(780,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc4MzM4OSwiZXhwIjoxNzQ3Mzg4MTg5fQ.nwFfzwRN9DDufJ_VjTGV18rJCz8jbrmHQ4zKygEjf_0','2025-05-16 15:06:30','2025-05-09 09:36:29'),(781,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3ODM0NjEsImV4cCI6MTc0NzM4ODI2MX0.HGA7Ju5Z9SiePEVMAX-RIJ5h7wBHybhuK5ayoybuvaY','2025-05-16 15:07:42','2025-05-09 09:37:41'),(782,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3ODM5OTgsImV4cCI6MTc0NzM4ODc5OH0.USNwcovN0FMTdUKppXJGnoioy1vXTkN3qZJ78zNuPEc','2025-05-16 09:46:39','2025-05-09 09:46:38'),(783,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3ODU4NjgsImV4cCI6MTc0NzM5MDY2OH0.Um9sAQdXlWEqUIVVyvbAON4iP9Y3SoMYBvBuykD5sCQ','2025-05-16 10:17:49','2025-05-09 10:17:48'),(784,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc4Nzk2NywiZXhwIjoxNzQ3MzkyNzY3fQ.aChIZfVqKmEHNewrWrmNrREbeDCiAi3Ny45SBdrx3Us','2025-05-16 16:22:48','2025-05-09 10:52:47'),(785,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc4ODg0NCwiZXhwIjoxNzQ3MzkzNjQ0fQ.ohQ_86dqFI10d6OI_2013Hawulejr1OJM2vs52bXfu8','2025-05-16 16:37:25','2025-05-09 11:07:24'),(786,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Njc4OTI2NCwiZXhwIjoxNzQ3Mzk0MDY0fQ.0aZj0kJdyCmykXT67PTpBDOg1-uDy6U3gRRLs5eQmJM','2025-05-16 11:14:25','2025-05-09 11:14:24'),(787,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc4OTMxOCwiZXhwIjoxNzQ3Mzk0MTE4fQ.yy3AapibUFoC6fPT1PuP1s2m4gKeyUnsvp9xas70NWk','2025-05-16 11:15:19','2025-05-09 11:15:18'),(788,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTIyMDUsImV4cCI6MTc0NzM5NzAwNX0.n04tWpgCxYZnIWCO8J60c2T0ZEQt312_KQ5y6yd44ZI','2025-05-16 12:03:26','2025-05-09 12:03:25'),(789,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTI2ODksImV4cCI6MTc0NzM5NzQ4OX0.S2HbzdUl3rHpDarw6wrPdg3HkKWaZuea3cG9WZ-roCw','2025-05-16 12:11:30','2025-05-09 12:11:30'),(790,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTI5NDQsImV4cCI6MTc0NzM5Nzc0NH0.MxjdUaI_ocIZ1-W54Fp1QGnTBkuNVlguj7Dn2JWZVeY','2025-05-16 12:15:45','2025-05-09 12:15:44'),(791,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTI5NDUsImV4cCI6MTc0NzM5Nzc0NX0.mm26w9YoDD5lGTQ4s_TmtfLK9elny0PRT3K0fWAM34I','2025-05-16 12:15:45','2025-05-09 12:15:45'),(792,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTMwMjQsImV4cCI6MTc0NzM5NzgyNH0.DMSsYs2WON_eN4BRZICeKPXs0NlwyFxPEqsaLp6yH4Y','2025-05-16 12:17:05','2025-05-09 12:17:04'),(793,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTMwMjYsImV4cCI6MTc0NzM5NzgyNn0.2bqg2g8nPxTa06v7r-Ns8SnIssoQpY3WaLK9XIvWSsI','2025-05-16 12:17:06','2025-05-09 12:17:06'),(794,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTMyNDgsImV4cCI6MTc0NzM5ODA0OH0.vCCeeLyTqvZPtvgsAaXaiOIIuIvOzNof1wSamN5qLF0','2025-05-16 12:20:48','2025-05-09 12:20:48'),(795,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTMzNTcsImV4cCI6MTc0NzM5ODE1N30.5FxXa7v0Kg_z4PnIAKR45FjfOkAQFZ2LvfpsA0sU2Rc','2025-05-16 12:22:37','2025-05-09 12:22:37'),(796,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc5NTA0NSwiZXhwIjoxNzQ3Mzk5ODQ1fQ.fFmbzoPSv9ik4m9-nR0fc42sJ9-eH_44emEfEvEim8E','2025-05-16 18:20:45','2025-05-09 12:50:45'),(797,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Njc5NTYzOCwiZXhwIjoxNzQ3NDAwNDM4fQ.0gbhesrr70dnT8VgLRVWX3qwBRMUNEDpMaUkavRRiSQ','2025-05-16 18:30:38','2025-05-09 13:00:38'),(798,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY3OTcwOTYsImV4cCI6MTc0NzQwMTg5Nn0.Ajr0T7qzfiu1XMViNN_e9awe8nsH1o9fEZ2wTk2ujSY','2025-05-16 18:54:57','2025-05-09 13:24:56'),(799,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY4MDU0MTUsImV4cCI6MTc0NzQxMDIxNX0.EP2ksqKP9EtnkWoLwfMg3HP3atc3z-fTGjE2i7TYeZ4','2025-05-16 15:43:36','2025-05-09 15:43:35'),(800,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY4MDU0MTUsImV4cCI6MTc0NzQxMDIxNX0.EP2ksqKP9EtnkWoLwfMg3HP3atc3z-fTGjE2i7TYeZ4','2025-05-16 15:43:36','2025-05-09 15:43:35'),(801,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY4NTU3ODgsImV4cCI6MTc0NzQ2MDU4OH0.486fgCdzjhUD4sM8rH9Tv8bQdZSR99XwpqCj-1lOV9I','2025-05-17 05:43:08','2025-05-10 05:43:08'),(802,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY5NDg2MDgsImV4cCI6MTc0NzU1MzQwOH0.kNh1IO0M57ms2aVG9Eg-hri7SmqHXl4XxEwOuIn5M2k','2025-05-18 07:30:09','2025-05-11 07:30:08'),(803,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY5NTY3NTksImV4cCI6MTc0NzU2MTU1OX0.KZScvUUuc9qjYyCMPC3Yj4o7yJuln4Vp-OrJEQ8sBMM','2025-05-18 09:46:00','2025-05-11 09:45:59'),(804,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY5NTY3NjAsImV4cCI6MTc0NzU2MTU2MH0.cpR0e8c9Z18HRwW-4chA-5_yznz6wPJ_ddKSCqB0O6I','2025-05-18 09:46:00','2025-05-11 09:46:00'),(805,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY5NTY3NjAsImV4cCI6MTc0NzU2MTU2MH0.cpR0e8c9Z18HRwW-4chA-5_yznz6wPJ_ddKSCqB0O6I','2025-05-18 09:46:01','2025-05-11 09:46:01'),(806,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzAyMzk3NCwiZXhwIjoxNzQ3NjI4Nzc0fQ.oWoaZQLAouU7tSsI4ZWTUwedw1oRVIB_iP8DmjyD150','2025-05-19 09:56:15','2025-05-12 04:26:14'),(807,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMjM5ODAsImV4cCI6MTc0NzYyODc4MH0.n-BxJgprRUTm-ux0Navy5PYNGPoOp-woK3b5acahT-8','2025-05-19 04:26:21','2025-05-12 04:26:20'),(808,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMzEyMzcsImV4cCI6MTc0NzYzNjAzN30.zxnKgV6ZNMVoUsoABN6a1nvpyB2DbX5_krGgyCPnVKw','2025-05-19 06:27:17','2025-05-12 06:27:17'),(809,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMzEyMzcsImV4cCI6MTc0NzYzNjAzN30.zxnKgV6ZNMVoUsoABN6a1nvpyB2DbX5_krGgyCPnVKw','2025-05-19 06:27:18','2025-05-12 06:27:17'),(810,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzAzMTMyMywiZXhwIjoxNzQ3NjM2MTIzfQ.IFg-QKwpRzDxWl6Bkn8D1nHiuphxYP_Wo2CxASDfEqY','2025-05-19 06:28:44','2025-05-12 06:28:43'),(811,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMzIzMDEsImV4cCI6MTc0NzYzNzEwMX0.V2rMG2nACBv4epNr_RpOzMstcoxb9hgut4WdJz3G7gk','2025-05-19 06:45:02','2025-05-12 06:45:01'),(812,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMzc3ODMsImV4cCI6MTc0NzY0MjU4M30.W562zz9MX14fYvelDZD_UxZREQbT_14UZ4oQL4i289Y','2025-05-19 08:16:23','2025-05-12 08:16:23'),(813,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwMzc3ODMsImV4cCI6MTc0NzY0MjU4M30.W562zz9MX14fYvelDZD_UxZREQbT_14UZ4oQL4i289Y','2025-05-19 08:16:23','2025-05-12 08:16:23'),(814,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcwNDY5MzcsImV4cCI6MTc0NzY1MTczN30.eLjzN4DmEUMzMt6yEBgywH27yFiiMTQx9x6-c0Ml_7U','2025-05-19 10:48:58','2025-05-12 10:48:58'),(815,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMDY4NjcsImV4cCI6MTc0NzcxMTY2N30.RIhXCPaIQvpV5HIUq1_6s-Ha8dRyTsqFVhlLlKERt4g','2025-05-20 03:27:48','2025-05-13 03:27:47'),(816,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMDY4NjcsImV4cCI6MTc0NzcxMTY2N30.RIhXCPaIQvpV5HIUq1_6s-Ha8dRyTsqFVhlLlKERt4g','2025-05-20 03:27:48','2025-05-13 03:27:47'),(817,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMDY4NjksImV4cCI6MTc0NzcxMTY2OX0.iUJFjhH7NPmtHKudD87kHfrlPJIGg3Q-vFWQS7SPkac','2025-05-20 03:27:50','2025-05-13 03:27:49'),(818,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzExMjM2OCwiZXhwIjoxNzQ3NzE3MTY4fQ.W13jrlWV8bzrnZrIzSIFTPnWXkFoECLkergLBHnsxRo','2025-05-20 04:59:28','2025-05-13 04:59:28'),(819,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMTM5NTksImV4cCI6MTc0NzcxODc1OX0.i7QVYxZg_IcrwlMLpQmiYhFmzLd_NL9igxucS5gE02w','2025-05-20 05:26:00','2025-05-13 05:26:00'),(820,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMTM5NjAsImV4cCI6MTc0NzcxODc2MH0.DU_eg5WQzqjVq2GSgVVsGvmemgCeVzBBO0Y5EXVculo','2025-05-20 05:26:00','2025-05-13 05:26:00'),(821,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMTUyNjEsImV4cCI6MTc0NzcyMDA2MX0.CpG9eAcs5-8DCf6oR0ZED448uuGl_FGzutKTWva8HPA','2025-05-20 11:17:41','2025-05-13 05:47:41'),(822,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzExNjE3NywiZXhwIjoxNzQ3NzIwOTc3fQ.vRUPpwSCvlokazjNvXnj4-rvhzm0JO1Leyit57Sv3Kw','2025-05-20 11:32:57','2025-05-13 06:02:57'),(823,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzExNzE2NSwiZXhwIjoxNzQ3NzIxOTY1fQ.WC6lHYmJ0g6NOKopmTMHi_sm8iDp53r_9ASIscXbXYM','2025-05-20 11:49:26','2025-05-13 06:19:25'),(825,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzExOTE2NywiZXhwIjoxNzQ3NzIzOTY3fQ.zeaSntfTlM4cZyV46EtcEAGGbiXXd0TuQKnyp4oy-xY','2025-05-20 12:22:47','2025-05-13 06:52:47'),(826,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMjIyMzMsImV4cCI6MTc0NzcyNzAzM30.pdWpB8-MJQCY7Qla2hmRdROeexfgw-bJlKPSvWYmfYE','2025-05-20 07:43:53','2025-05-13 07:43:53'),(827,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMjcxMTksImV4cCI6MTc0NzczMTkxOX0.jK4LKJ9WxUXKGOPYtlaz_89GE7cfgqACze8fr2f-1dM','2025-05-20 14:35:20','2025-05-13 09:05:19'),(828,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzEzMjc5NiwiZXhwIjoxNzQ3NzM3NTk2fQ.pcwbnLVeHI6YM6MREBmLrjlMJsPnfCxq4SRoVlHQpsA','2025-05-20 16:09:56','2025-05-13 10:39:56'),(829,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMzQ2OTQsImV4cCI6MTc0NzczOTQ5NH0.0antbjoc9Ijl4AFXVwFcXVpaPEW4igxXoDKBC-BBfVw','2025-05-20 11:11:35','2025-05-13 11:11:34'),(830,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMzg2NDYsImV4cCI6MTc0Nzc0MzQ0Nn0.pfBAY0ZW9RN526pSgJvY3Tf5jP3_Z-PckIoNjjx9VQY','2025-05-20 12:17:26','2025-05-13 12:17:26'),(831,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxMzg2NDYsImV4cCI6MTc0Nzc0MzQ0Nn0.pfBAY0ZW9RN526pSgJvY3Tf5jP3_Z-PckIoNjjx9VQY','2025-05-20 12:17:27','2025-05-13 12:17:27'),(832,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzE5NzgwMiwiZXhwIjoxNzQ3ODAyNjAyfQ.8IwqCE2I0xw1lNkSwr9ECV6pcr-gTcbka0Mxr5wZmbM','2025-05-21 10:13:22','2025-05-14 04:43:22'),(833,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxOTgzMTIsImV4cCI6MTc0NzgwMzExMn0.ZBMcjNQEHacBjkhPS0Pnir_YGVf_3c09YNgIpZafzwo','2025-05-21 10:21:52','2025-05-14 04:51:52'),(834,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxOTg4ODMsImV4cCI6MTc0NzgwMzY4M30.KllRrM8nZRrdqwUK951IODCjsiiU9KOjNQvWHiCk3X4','2025-05-21 10:31:24','2025-05-14 05:01:23'),(835,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcxOTk3OTEsImV4cCI6MTc0NzgwNDU5MX0.Pn38HdPnBWn3mXGafLcsgTe8W0BTkInGpzdisKuXmHU','2025-05-21 05:16:31','2025-05-14 05:16:31'),(836,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMDM5MDcsImV4cCI6MTc0NzgwODcwN30.LX_JHpVxrFToJop-VwpkzOOva8KZv18-VsrO60NDgQ0','2025-05-21 06:25:08','2025-05-14 06:25:07'),(837,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzIxNTA2MCwiZXhwIjoxNzQ3ODE5ODYwfQ.8FtSWdDZHV07xHs-ZOsFs3KaAWMAs8PUnddMbLra7t4','2025-05-21 09:31:01','2025-05-14 09:31:00'),(838,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzIxOTIyOSwiZXhwIjoxNzQ3ODI0MDI5fQ.snWmSU1j45f9OIEAsFQb9k-qTEtwKyloSysAaQmCzHw','2025-05-21 16:10:29','2025-05-14 10:40:29'),(839,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjA0NzAsImV4cCI6MTc0NzgyNTI3MH0.Z_eGnbbPIvsrKVBypi60_QuTVsO1uF6RlyaJx7qWick','2025-05-21 16:31:10','2025-05-14 11:01:10'),(840,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjExOTEsImV4cCI6MTc0NzgyNTk5MX0.g9wt7fa3Q98Qy183j7sbIxnZlRET6EqVYPX5-W8z_n0','2025-05-21 11:13:12','2025-05-14 11:13:11'),(841,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjEyNzgsImV4cCI6MTc0NzgyNjA3OH0.B575sagRLCTiI6dxrCWhJ21VF1NUNyTdNsdv86_mth8','2025-05-21 11:14:39','2025-05-14 11:14:38'),(842,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzIyMjU4OCwiZXhwIjoxNzQ3ODI3Mzg4fQ.XezCbW8yX_0Frti1fY5b5apc6V9miPyt1o1K1Yqz2Ac','2025-05-21 11:36:29','2025-05-14 11:36:28'),(843,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzIyMjcwOCwiZXhwIjoxNzQ3ODI3NTA4fQ.COp0tVRllF8lYlRoxs-YEsQe8_zXeVpWJq-OXIwzi1U','2025-05-21 11:38:28','2025-05-14 11:38:28'),(844,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjMxNjIsImV4cCI6MTc0NzgyNzk2Mn0.j3U_CHj73mdBtT07-ZvpsxPtcePldQ4Lud76EMVE5UI','2025-05-21 17:16:02','2025-05-14 11:46:02'),(845,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjMyMDUsImV4cCI6MTc0NzgyODAwNX0.NVfDnTOYHK6aKXeQp_ucJS973M2x2GjadE7W-hxju-8','2025-05-21 11:46:45','2025-05-14 11:46:45'),(846,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjM3MjYsImV4cCI6MTc0NzgyODUyNn0.wkgtSQYwSwi_sksAkJSW6aryvtPXQ7voieIHPrie0nM','2025-05-21 11:55:27','2025-05-14 11:55:26'),(847,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjM4MjEsImV4cCI6MTc0NzgyODYyMX0.YhoNjFSC-TDD5xRpGyIjxyQ1sF-0bSlNy3Xlu9F5WCo','2025-05-21 11:57:01','2025-05-14 11:57:01'),(848,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjM5NzksImV4cCI6MTc0NzgyODc3OX0.RLFusM1JAlnWvpdGtr2LU58vlP98Qr7MqjzVJ3pIhiU','2025-05-21 11:59:39','2025-05-14 11:59:39'),(849,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjQzMjIsImV4cCI6MTc0NzgyOTEyMn0.rp96NEgHO0DMrnLNPNNZ8bbJD63CxkZaRWRA_X8kbqU','2025-05-21 12:05:22','2025-05-14 12:05:22'),(850,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjQzMjMsImV4cCI6MTc0NzgyOTEyM30.1nY61gLt7ZGpXW_jOeLQxt2ULvjH576xqQ9VtMRk7P0','2025-05-21 12:05:24','2025-05-14 12:05:23'),(851,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjQzNTMsImV4cCI6MTc0NzgyOTE1M30.9uVXhazdIJYkpckaxGbQ4AGfWxNNNUCkpxXtY6G5Lw4','2025-05-21 12:05:54','2025-05-14 12:05:54'),(852,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjQzNTUsImV4cCI6MTc0NzgyOTE1NX0.iCuC7JJUdP_90CgHQSEMcMPJ4ymZjGtIHCqyzzl9JV0','2025-05-21 12:05:55','2025-05-14 12:05:55'),(853,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMjUxODQsImV4cCI6MTc0NzgyOTk4NH0.PyEGEY4DZHQks_CCjcAThN2dPipMN5NXtvq4D6EbBRk','2025-05-21 12:19:45','2025-05-14 12:19:44'),(854,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMzc2NjEsImV4cCI6MTc0Nzg0MjQ2MX0.gknnO4cKPdzVjZcLFzIeoMQRH7TwU76O3jtpX81qPFQ','2025-05-21 15:47:42','2025-05-14 15:47:41'),(855,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyMzc2NjIsImV4cCI6MTc0Nzg0MjQ2Mn0.dFaFsYv5ZiSKMy69_fgUS1B4y5jLJLmVGvcrA6RlD8Y','2025-05-21 15:47:42','2025-05-14 15:47:42'),(856,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyNDE5ODMsImV4cCI6MTc0Nzg0Njc4M30.H6U4hgI94ByYTVRC0b00X4yYEhW_WoM75mNKWK-ma_8','2025-05-21 16:59:43','2025-05-14 16:59:43'),(857,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyNDE5ODMsImV4cCI6MTc0Nzg0Njc4M30.H6U4hgI94ByYTVRC0b00X4yYEhW_WoM75mNKWK-ma_8','2025-05-21 16:59:43','2025-05-14 16:59:43'),(858,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODM5MzgsImV4cCI6MTc0Nzg4ODczOH0.-uEBu_pMMJR9YXw7kxacGOSrLKZTITFAmPfAy_4yfZI','2025-05-22 04:38:59','2025-05-15 04:38:58'),(859,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODQwOTEsImV4cCI6MTc0Nzg4ODg5MX0.k3VbMXieCNHXMjCQGYsVdbxQiBbzJITVGQo-F0RhETI','2025-05-22 04:41:31','2025-05-15 04:41:31'),(860,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODQxMjMsImV4cCI6MTc0Nzg4ODkyM30.qwymitItjBFN3bNOFStgUmLl4ihc86VVZPQ8lRvcXkg','2025-05-22 04:42:03','2025-05-15 04:42:03'),(861,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzI4NDI0MiwiZXhwIjoxNzQ3ODg5MDQyfQ.TS0iRvCMeiJN11rH7vtgeY0OcyNVdwBwThnGsX2WZoM','2025-05-22 04:44:02','2025-05-15 04:44:02'),(862,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzI4NDMyOSwiZXhwIjoxNzQ3ODg5MTI5fQ.BhECWq9Fzgc2QBfOTq8yPo6jMXNEqWOfcM_FcC0HVDk','2025-05-22 04:45:29','2025-05-15 04:45:29'),(863,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzI4NDM4MCwiZXhwIjoxNzQ3ODg5MTgwfQ.lkojCRLHp4c4IAy3G40dkfWHFNSy2gPriRzM_p4U3XM','2025-05-22 04:46:21','2025-05-15 04:46:21'),(864,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzI4NTkyNCwiZXhwIjoxNzQ3ODkwNzI0fQ.d_uddgaFPj8AnmFvoEoLvT3nb1eOBAWamAjeZFA5sMA','2025-05-22 10:42:04','2025-05-15 05:12:04'),(865,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODcyNzEsImV4cCI6MTc0Nzg5MjA3MX0.nKgPEmNn-mxbCLgq_tXuXhIH6L_-zaOQnmS3LcahMQY','2025-05-22 05:34:32','2025-05-15 05:34:31'),(866,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODcyOTUsImV4cCI6MTc0Nzg5MjA5NX0.JA1Y3RI5xkd0W8zHu1NvoVmmseE98_HCOMaDU7UqS40','2025-05-22 05:34:55','2025-05-15 05:34:55'),(867,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODc2NjUsImV4cCI6MTc0Nzg5MjQ2NX0.0EOwH2HBAVXAvjIvfPrNwv-fgDCBZUOJfhbfZswVN4k','2025-05-22 05:41:05','2025-05-15 05:41:05'),(868,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODg1MzEsImV4cCI6MTc0Nzg5MzMzMX0.YlS4kpSu3YzJ0-MeOKQ_4AR-zLO5mCmERARHz6K34y0','2025-05-22 05:55:32','2025-05-15 05:55:31'),(869,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODg4MDYsImV4cCI6MTc0Nzg5MzYwNn0.fz_QZ5On8FqV3qx46PFWsWWRhQ-0U4JRbfp9NhX0zy4','2025-05-22 06:00:07','2025-05-15 06:00:07'),(870,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDcyODkyNDgsImV4cCI6MTc0Nzg5NDA0OH0.IbL-jli_U0_D8uYHo5HOTbfyt1USN-_jutYEXwSYDks','2025-05-22 06:07:28','2025-05-15 06:07:28'),(871,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzI5MDUyOSwiZXhwIjoxNzQ3ODk1MzI5fQ.MT8vZHnNrXl64TNEZNjYVaoxOlMB6qZeabHQuzT31ZU','2025-05-22 11:58:49','2025-05-15 06:28:49'),(872,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzI5MDc5MSwiZXhwIjoxNzQ3ODk1NTkxfQ.BsLDsFndMHL5oKcDxR8SZXjelziM81kPE9DamZA1omE','2025-05-22 12:03:12','2025-05-15 06:33:11'),(878,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczMDM1NjEsImV4cCI6MTc0NzkwODM2MX0._mXhUpTWbgTYvFaLddWycvUHih11Ne0ig1OLUM1Bz14','2025-05-22 15:36:01','2025-05-15 10:06:01'),(879,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczMDQxMDMsImV4cCI6MTc0NzkwODkwM30.1yHimJb6hGYP71neOMlAEBzNrlDv67luhv7-8UG4wqA','2025-05-22 10:15:04','2025-05-15 10:15:03'),(880,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczMDQxMDMsImV4cCI6MTc0NzkwODkwM30.1yHimJb6hGYP71neOMlAEBzNrlDv67luhv7-8UG4wqA','2025-05-22 10:15:04','2025-05-15 10:15:04'),(883,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczMTQzNjQsImV4cCI6MTc0NzkxOTE2NH0.cNgphDmT-ygZtGiXTMAVVZjBPH6AifJagaPXyXEPZS4','2025-05-22 13:06:04','2025-05-15 13:06:04'),(884,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczMTQzNjUsImV4cCI6MTc0NzkxOTE2NX0.h2tKTgODWAFq7dp2PdvFC4x1NRhibhYW-r1-Y7dg0OU','2025-05-22 13:06:05','2025-05-15 13:06:05'),(885,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczNzk5MjYsImV4cCI6MTc0Nzk4NDcyNn0.6ynuxgJAFS2x3L4RQyc4ZN9LqBuL5DlEgjKsTWDuSJg','2025-05-23 07:18:46','2025-05-16 07:18:46'),(886,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczNzk5MjcsImV4cCI6MTc0Nzk4NDcyN30.h7U_ccOFunc0w0h1-Xdt4I8LmAIodiZGIVBizaiCvIs','2025-05-23 07:18:47','2025-05-16 07:18:47'),(887,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzM3OTk5NCwiZXhwIjoxNzQ3OTg0Nzk0fQ.thGcmKj95tHwQIkowlhl6xTkiHVcTR4jFwbs1h5rW6c','2025-05-23 07:19:54','2025-05-16 07:19:54'),(888,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODUwMDcsImV4cCI6MTc0Nzk4OTgwN30.YZtAcM6mmlDyrLsEBznYmUVCgGOhCEI9a15fH1sCflk','2025-05-23 08:43:28','2025-05-16 08:43:28'),(889,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODUyMzAsImV4cCI6MTc0Nzk5MDAzMH0.GRgPn2lAB-kdBmxn4r3bh17QQL-IvBGGsOGy_n1G6Ns','2025-05-23 08:47:10','2025-05-16 08:47:10'),(890,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODUyNzAsImV4cCI6MTc0Nzk5MDA3MH0.uWchPyx0QzV2PcnW4vukF8Ab3EbTd_LwnsYZH4xEYzg','2025-05-23 08:47:50','2025-05-16 08:47:50'),(891,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODYxMjYsImV4cCI6MTc0Nzk5MDkyNn0.s7sKfspzTCD59jaPSIfb1qi5-Gvax1NUHV7fnjvyjzY','2025-05-23 09:02:06','2025-05-16 09:02:06'),(892,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODYzNTUsImV4cCI6MTc0Nzk5MTE1NX0.zmGw81LU20CYsRJzdD19gmXE7rNBnwKwCTQWwktCSmA','2025-05-23 09:05:55','2025-05-16 09:05:55'),(893,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODY4MzYsImV4cCI6MTc0Nzk5MTYzNn0.3x-rOmXif8EUYtfAjr1QZ_XZQflksVVJvTCPrBohGFw','2025-05-23 14:43:56','2025-05-16 09:13:56'),(894,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczODcwNTgsImV4cCI6MTc0Nzk5MTg1OH0.SOdvVrGKkwEN5ad3A_SX6jHPIhNLMN1Iu7UQaDj6KK8','2025-05-23 14:47:39','2025-05-16 09:17:38'),(895,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzM5MDYwMywiZXhwIjoxNzQ3OTk1NDAzfQ.jwhjCEwpxSpdik_CHMl7uksHgG5ot4wUFbuOep3OBLw','2025-05-23 15:46:44','2025-05-16 10:16:43'),(896,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDczOTUzNjgsImV4cCI6MTc0ODAwMDE2OH0.QUFXMzZGukk5W7LWoHvQj5dchRDLdiz6XcvbP-kiMvw','2025-05-23 11:36:08','2025-05-16 11:36:08'),(897,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc0MjA3MTYsImV4cCI6MTc0ODAyNTUxNn0.mWkYxhPG18eBDv5uofTd_-6OKz2ms-pDPj3Kg32OYXk','2025-05-23 18:38:36','2025-05-16 18:38:36'),(898,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc0MjA3MTYsImV4cCI6MTc0ODAyNTUxNn0.mWkYxhPG18eBDv5uofTd_-6OKz2ms-pDPj3Kg32OYXk','2025-05-23 18:38:37','2025-05-16 18:38:36'),(899,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc0OTkwMTIsImV4cCI6MTc0ODEwMzgxMn0.lIgRAVuCkPi8mNvtUWbMa4WhmkCxgJj4RltkQa1sP6I','2025-05-24 16:23:32','2025-05-17 16:23:32'),(900,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc0OTkwMTIsImV4cCI6MTc0ODEwMzgxMn0.lIgRAVuCkPi8mNvtUWbMa4WhmkCxgJj4RltkQa1sP6I','2025-05-24 16:23:32','2025-05-17 16:23:32'),(901,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc1MDkxMjgsImV4cCI6MTc0ODExMzkyOH0.NIj9ieYzka2njUVOhSygCT3kguWRRxhuF9iFg0_jo2o','2025-05-24 19:12:08','2025-05-17 19:12:08'),(902,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc1MDkxMjgsImV4cCI6MTc0ODExMzkyOH0.NIj9ieYzka2njUVOhSygCT3kguWRRxhuF9iFg0_jo2o','2025-05-24 19:12:09','2025-05-17 19:12:08'),(903,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2MzE0MDIsImV4cCI6MTc0ODIzNjIwMn0.bN4VPO68dvzBEawV_EhFIYqDZ4VYTdRa1OHwOMg1Rec','2025-05-26 05:10:03','2025-05-19 05:10:02'),(904,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2MzE0MDMsImV4cCI6MTc0ODIzNjIwM30.3uA7AdqKmvPyWWaofbg-qc9HTs9F5ZLCJnbm8U_n8RA','2025-05-26 05:10:03','2025-05-19 05:10:03'),(905,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NzYzMjI2OCwiZXhwIjoxNzQ4MjM3MDY4fQ.7gJsC2NSWiYkIVLx_tt0VxN0R7dwxvEMh6KSZ-bjI1Y','2025-05-26 05:24:29','2025-05-19 05:24:28'),(906,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2MzMzNTMsImV4cCI6MTc0ODIzODE1M30.2cbzVuhQgSEKgbn7tcwy6AXIpJj2r-oPGrxHTGoCu6g','2025-05-26 05:42:34','2025-05-19 05:42:33'),(907,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2MzQ2MjMsImV4cCI6MTc0ODIzOTQyM30.gfPHemhtCgvDr6WIhXF72LXj3k3EvIK957aNWEGI2N0','2025-05-26 06:03:44','2025-05-19 06:03:43'),(908,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2MzQ2MjUsImV4cCI6MTc0ODIzOTQyNX0.3mVzYR90RR-k_KHu_Ku_WxDq1_21gGmM5-wAaxiwZO8','2025-05-26 06:03:46','2025-05-19 06:03:45'),(915,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2NTE0MDIsImV4cCI6MTc0ODI1NjIwMn0.2KEc7FCMtRRECEbvcnwgeQdm00VmQtathIUKfSn1aDY','2025-05-26 10:43:22','2025-05-19 10:43:22'),(916,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc2NjQ2NTAsImV4cCI6MTc0ODI2OTQ1MH0.oUcnssy7-slpU6EUhqk1Eb6-zL0DDr60Ir_hxjxU3Og','2025-05-26 14:24:11','2025-05-19 14:24:10'),(917,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc3Mjg0MDQsImV4cCI6MTc0ODMzMzIwNH0.ZH_ebXmTdMQr1qpMHf79burYogNn_vO-oDgV_h412GY','2025-05-27 08:06:44','2025-05-20 08:06:44'),(918,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc3NDE5MjksImV4cCI6MTc0ODM0NjcyOX0.yLee5GtyWtWW6ID1ojzAexkW5SicRAtz6m-aN7EZECU','2025-05-27 11:52:10','2025-05-20 11:52:09'),(919,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc3NDE5MzAsImV4cCI6MTc0ODM0NjczMH0.qNWgB-dracPYJojZCzcKZ1E2pTSqQ_XdX4Qy_YKdUUo','2025-05-27 11:52:10','2025-05-20 11:52:10'),(920,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0Nzc0MzEyMCwiZXhwIjoxNzQ4MzQ3OTIwfQ.QIaAURAklHtr2LIKuxZh1AcoZ-ACjXtmfvDZzI9wFj8','2025-05-27 17:42:00','2025-05-20 12:12:00'),(921,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4MDU5NzYsImV4cCI6MTc0ODQxMDc3Nn0.t4jltmlN1dTZ-fjHE_ntwlLuOFn7-Qm3SPvJpEozRqI','2025-05-28 05:39:37','2025-05-21 05:39:37'),(922,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4MDU5NzcsImV4cCI6MTc0ODQxMDc3N30.mZByyTECbr1zFw0o7xJBlFVVYaLW0iWVR1SXvpCvdGs','2025-05-28 05:39:38','2025-05-21 05:39:37'),(923,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NzgxODkzMywiZXhwIjoxNzQ4NDIzNzMzfQ.cDJaSGNdaMwNKSROZjcnMt4dHaCmuQAwZHjVtIMhPdY','2025-05-28 14:45:33','2025-05-21 09:15:33'),(924,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4MTk2NTIsImV4cCI6MTc0ODQyNDQ1Mn0._IGEcx6WWGvH51gxhbAUQJrBo9v7dG2875y_-koUNj8','2025-05-28 14:57:33','2025-05-21 09:27:32'),(925,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4MjgyNjMsImV4cCI6MTc0ODQzMzA2M30.cw91XiVv18SziJdwyp2P8FTBvUQ8jkpobFGicRB0ok8','2025-05-28 11:51:04','2025-05-21 11:51:03'),(926,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4MjgyNjQsImV4cCI6MTc0ODQzMzA2NH0.ZGhu89G49TkDLhtJlKDB5wkayVoj2aeW7KIxbjvG1vk','2025-05-28 11:51:04','2025-05-21 11:51:04'),(927,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4NDE5NzksImV4cCI6MTc0ODQ0Njc3OX0.zEG79VpxrO7tAe7_Luydi3l4woY30S7SLD9GMFvPeW8','2025-05-28 15:39:39','2025-05-21 15:39:39'),(928,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4NDE5NzksImV4cCI6MTc0ODQ0Njc3OX0.zEG79VpxrO7tAe7_Luydi3l4woY30S7SLD9GMFvPeW8','2025-05-28 15:39:40','2025-05-21 15:39:39'),(929,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4NDE5NzksImV4cCI6MTc0ODQ0Njc3OX0.zEG79VpxrO7tAe7_Luydi3l4woY30S7SLD9GMFvPeW8','2025-05-28 15:39:40','2025-05-21 15:39:39'),(930,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4NDIwMDksImV4cCI6MTc0ODQ0NjgwOX0.aNcV7_yoC7MglWCaaiDEy9fLXQUYQYovgAB7Y3flrVY','2025-05-28 15:40:10','2025-05-21 15:40:09'),(931,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4ODkzMjcsImV4cCI6MTc0ODQ5NDEyN30.flY8wlMA3QsaPaAc0o-jdPdNLdWdIqoRvcKvLS2o9yw','2025-05-29 10:18:47','2025-05-22 04:48:47'),(932,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4OTMxMzQsImV4cCI6MTc0ODQ5NzkzNH0.rFpMhwaygVzQjd-o7SsJor2ORDW1hlvfDoBVy5Dvan8','2025-05-29 11:22:15','2025-05-22 05:52:14'),(933,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4OTMxMzQsImV4cCI6MTc0ODQ5NzkzNH0.rFpMhwaygVzQjd-o7SsJor2ORDW1hlvfDoBVy5Dvan8','2025-05-29 11:22:15','2025-05-22 05:52:14'),(934,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Nzg5MzMwMiwiZXhwIjoxNzQ4NDk4MTAyfQ.LyZ9TusyafSpJ6SlyfB_fCa3dmM7NZw8VADlxlF0e8k','2025-05-29 05:55:03','2025-05-22 05:55:02'),(935,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4OTUxMjIsImV4cCI6MTc0ODQ5OTkyMn0.uRSRo7TPU9utdcg8bB6P6tmztZVc2lv3S_QZUCngAyw','2025-05-29 06:25:22','2025-05-22 06:25:22'),(936,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc4OTUxMjMsImV4cCI6MTc0ODQ5OTkyM30.aA8-LygRPPSogKFJI9VHp_E3RcJS7DiPYKSoN6_lOYA','2025-05-29 06:25:24','2025-05-22 06:25:23'),(937,199,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxOTksInJvbGVfaWQiOjMsImlhdCI6MTc0Nzg5NTI0MywiZXhwIjoxNzQ4NTAwMDQzfQ.H6joAG1glWPEtwJa403tgPbQj_gef1aISDKByy5COHM','2025-05-29 06:27:24','2025-05-22 06:27:23'),(938,199,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxOTksInJvbGVfaWQiOjMsImlhdCI6MTc0Nzg5NTcxOCwiZXhwIjoxNzQ4NTAwNTE4fQ.3Tui2ZlSnwSKKckI_461wmMFGORA29_SLklAkQckZ_Y','2025-05-29 06:35:19','2025-05-22 06:35:19'),(939,199,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxOTksInJvbGVfaWQiOjMsImlhdCI6MTc0Nzg5OTMzMiwiZXhwIjoxNzQ4NTA0MTMyfQ.57oKBWuKqjXC8uuuu3EQjWVzMJCUhAi2AAuCiODOTX4','2025-05-29 13:05:32','2025-05-22 07:35:32'),(940,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzExMiwiZXhwIjoxNzQ4NTExOTEyfQ.kkZdIuis4wghe1Y8jn5Ay-4pqmS7oMaW3Znml9K9khI','2025-05-29 09:45:13','2025-05-22 09:45:12'),(941,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzQ1OSwiZXhwIjoxNzQ4NTEyMjU5fQ.ljSaEyZPt8aq8gYcajcTVRXOsIePV75Jq5rdUiPYVDA','2025-05-29 09:51:00','2025-05-22 09:50:59'),(942,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzY5OSwiZXhwIjoxNzQ4NTEyNDk5fQ.njtg4HTCgHw-mpSwv7LCalXmNstCtZ94S8ERsmQIhWU','2025-05-29 09:54:59','2025-05-22 09:54:59'),(943,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwNzg5OCwiZXhwIjoxNzQ4NTEyNjk4fQ.Kp1jXKid6xofYOeeqOiqVZKJIOsYM9lZdoqn_3zE5MU','2025-05-29 09:58:19','2025-05-22 09:58:18'),(944,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODQwMywiZXhwIjoxNzQ4NTEzMjAzfQ.jQfsMJDPq3esB9tXb2p7_b_XXeBDtXFkTOt1-K-dPAo','2025-05-29 10:06:44','2025-05-22 10:06:43'),(945,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODQxNCwiZXhwIjoxNzQ4NTEzMjE0fQ.szfUlnyKarFvdc8FNMDY0b1c6zbHtZ7inZg4sHGUjPA','2025-05-29 10:06:55','2025-05-22 10:06:54'),(946,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODQ3NCwiZXhwIjoxNzQ4NTEzMjc0fQ.q00IdoxnOExLGF2LQyAtGYGLFU759tvEvHy74McYM7k','2025-05-29 10:07:55','2025-05-22 10:07:54'),(947,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODU3OCwiZXhwIjoxNzQ4NTEzMzc4fQ.i57kDmX8yvS9xEVl7d5wj8oqFBcA93GEhlol-5pPMtM','2025-05-29 10:09:39','2025-05-22 10:09:38'),(948,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODU5OCwiZXhwIjoxNzQ4NTEzMzk4fQ.uqzwMf2_Z88GBCltnK71991WBZgsroMHnZ_CZttSJcc','2025-05-29 10:09:59','2025-05-22 10:09:58'),(949,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0NzkwODYzOSwiZXhwIjoxNzQ4NTEzNDM5fQ.gVZrjDVUq0t-uhz8L5N02aiCFr3lEV4s1eKtQ5Bb0ks','2025-05-29 10:10:40','2025-05-22 10:10:40'),(950,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkwODgzOSwiZXhwIjoxNzQ4NTEzNjM5fQ.EWlu-eQS13qARMJ8VHGdMCGo8lYyViba2q58T8-qe-c','2025-05-29 15:43:59','2025-05-22 10:13:59'),(951,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkxMDcxMywiZXhwIjoxNzQ4NTE1NTEzfQ.CfMJBnb4mRoScRTcMjCx7zVpMFSv-Cll2BtMfNIAN7g','2025-05-29 16:15:13','2025-05-22 10:45:13'),(952,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkxMDc1NCwiZXhwIjoxNzQ4NTE1NTU0fQ.crAmmkz2fQucqM44S4jy_osHepOfSCJf4Vcb3gBv3Zk','2025-05-29 16:15:55','2025-05-22 10:45:55'),(953,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkxMDgwMiwiZXhwIjoxNzQ4NTE1NjAyfQ.bw5eMGxntSxzAEDiBhJmu-YgcIBfOb0UmYa0jDbQ2NM','2025-05-29 16:16:42','2025-05-22 10:46:42'),(954,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkxMDgxMCwiZXhwIjoxNzQ4NTE1NjEwfQ.3tdAiin-SpWPOwNQeg83abTGmyM2yyWERygSYQBohR0','2025-05-29 16:16:50','2025-05-22 10:46:50'),(955,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0NzkxMDg1NiwiZXhwIjoxNzQ4NTE1NjU2fQ.mEX6PojcyrBnKlS44zPM_kPw26S-F_YPyMv3R_DzbCE','2025-05-29 16:17:36','2025-05-22 10:47:36'),(956,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc5MTE5MDgsImV4cCI6MTc0ODUxNjcwOH0.TuocGk5gzeHnWAEVmiGPL9thjgGu4_vw56TRmzil6II','2025-05-29 16:35:08','2025-05-22 11:05:08'),(957,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc5Mzc2MzEsImV4cCI6MTc0ODU0MjQzMX0.6_Vsy3TiEy15E9jOv4CqTEZgd5FIevNrfxe0j3TqeTY','2025-05-29 18:13:51','2025-05-22 18:13:51'),(958,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc5NzM3NTksImV4cCI6MTc0ODU3ODU1OX0.zzKeib9lLVN9dL53tZTPUull3jkLT-e2IQLn1x0XwFM','2025-05-30 09:46:00','2025-05-23 04:15:59'),(959,213,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMTMsInJvbGVfaWQiOjMsImlhdCI6MTc0Nzk3NTk5MCwiZXhwIjoxNzQ4NTgwNzkwfQ.jOUUm25PqUo29rsCMl7QhgdX6xi4Ipx35UER_2g8Shw','2025-05-30 10:23:10','2025-05-23 04:53:10'),(960,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0Nzk3NjMyNCwiZXhwIjoxNzQ4NTgxMTI0fQ.rob9kT1-bdGB0y_kIEDv8hwKeOXpfyb82k4EuozhWeQ','2025-05-30 10:28:44','2025-05-23 04:58:44'),(961,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc5NzgxNTYsImV4cCI6MTc0ODU4Mjk1Nn0.oMpI7Ki9jEaUnbTTewGT1ZhdwZqvpGPvpiH_yIcHMcY','2025-05-30 05:29:16','2025-05-23 05:29:16'),(962,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0Nzk4MTc3NCwiZXhwIjoxNzQ4NTg2NTc0fQ.YR-MrTU88NIrvwPQa-xqYNoTPFXcF6lMGIwtwuphq48','2025-05-30 11:59:35','2025-05-23 06:29:35'),(963,204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDQsInJvbGVfaWQiOjIsImlhdCI6MTc0Nzk4MTgzNiwiZXhwIjoxNzQ4NTg2NjM2fQ.J2GPuMh6_BJ8NhqPaoCFZiizAKS1NcTly4u6-nK-51E','2025-05-30 12:00:36','2025-05-23 06:30:36'),(964,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDc5OTI5MTYsImV4cCI6MTc0ODU5NzcxNn0.uRR3xsrrptMHAWSqyfmpCDqggW_wuVD0xnQMlUP2DgI','2025-05-30 15:05:17','2025-05-23 09:35:16'),(965,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0ODA2Njk2NCwiZXhwIjoxNzQ4NjcxNzY0fQ.pf6fpfD9xBDpB0PctohJLmsxM6QMPL34Aa6HVd3zyoA','2025-05-31 06:09:25','2025-05-24 06:09:25'),(966,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNjgxNTMsImV4cCI6MTc0ODY3Mjk1M30.YKYhXcm2fHeiU16-_1MNmB100fJhDEF_lIg70mlX1NU','2025-05-31 06:29:14','2025-05-24 06:29:14'),(967,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNzAzNDgsImV4cCI6MTc0ODY3NTE0OH0.z2QG1KYpxJWoEjUa7ZpZMJ75tW9gqbiNldarFLLonaQ','2025-05-31 07:05:49','2025-05-24 07:05:48'),(968,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNzAzNDgsImV4cCI6MTc0ODY3NTE0OH0.z2QG1KYpxJWoEjUa7ZpZMJ75tW9gqbiNldarFLLonaQ','2025-05-31 07:05:49','2025-05-24 07:05:48'),(969,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNzAzNDksImV4cCI6MTc0ODY3NTE0OX0.PKtvPg9R8at724N3e0LqXPc59NkVXuN-HHrr_6Nx5SQ','2025-05-31 07:05:49','2025-05-24 07:05:49'),(970,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNzQwODAsImV4cCI6MTc0ODY3ODg4MH0.Rv7pYCod7EimjyjqBvYvwkTha6p2dl8_8fmG5b0Dqfc','2025-05-31 08:08:00','2025-05-24 08:08:00'),(971,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgwNzQwODAsImV4cCI6MTc0ODY3ODg4MH0.Rv7pYCod7EimjyjqBvYvwkTha6p2dl8_8fmG5b0Dqfc','2025-05-31 08:08:01','2025-05-24 08:08:00'),(972,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgyMzU1MzAsImV4cCI6MTc0ODg0MDMzMH0.Iu0QD7Fu7ZTWv0g1yTdfQos-9uPU6ZJ-ZNiVGoVKock','2025-06-02 04:58:50','2025-05-26 04:58:50'),(973,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgyMzY5NzcsImV4cCI6MTc0ODg0MTc3N30.Y_QVerrXFcdh0Fx3-o4YMeoJFxTe8RtnZJMHNB0uBCQ','2025-06-02 10:52:58','2025-05-26 05:22:58'),(974,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0ODIzNzkxNCwiZXhwIjoxNzQ4ODQyNzE0fQ.3NY4y4My_5ckugpQxaDrwfTPIzrDfYDRtNidWyhFYFQ','2025-06-02 05:38:35','2025-05-26 05:38:34'),(975,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgyMzgwMDAsImV4cCI6MTc0ODg0MjgwMH0.MqHCGWObrXW8-iQ0gqP-JSi98oVM4Xfuu5Lc0kc5qoQ','2025-06-02 05:40:00','2025-05-26 05:40:00'),(976,205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDUsInJvbGVfaWQiOjMsImlhdCI6MTc0ODI0MTA5OCwiZXhwIjoxNzQ4ODQ1ODk4fQ.jXoMyVExl8TGzl3PJe90GyusCL00vov5yk8FjLo8cDE','2025-06-02 06:31:38','2025-05-26 06:31:38'),(977,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0ODI0MTQ1MiwiZXhwIjoxNzQ4ODQ2MjUyfQ.1RJkR_iU4kYozLlgcAZyg54nXJlc2T39pVak0pBpFkc','2025-06-02 06:37:33','2025-05-26 06:37:33'),(978,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0ODI1MDkxNiwiZXhwIjoxNzQ4ODU1NzE2fQ.yWsS5skXaCtiG3HjgGwSODIR9hjkcRqtc4NzbdTvd8s','2025-06-02 09:15:16','2025-05-26 09:15:16'),(979,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgyNTUwODksImV4cCI6MTc0ODg1OTg4OX0.96D_JyVIREPCYUJA8D9_MmF1pb1LaVVpLyHsnh3kamQ','2025-06-02 15:54:50','2025-05-26 10:24:49'),(980,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDgyNTYyOTUsImV4cCI6MTc0ODg2MTA5NX0.zuuTSAjkgRAfha96nDSkIJiLCn6StDwxDc4X48TL5MM','2025-06-02 10:44:55','2025-05-26 10:44:55');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards`
--

DROP TABLE IF EXISTS `rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `terms_and_conditions` text NOT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `reward_type` enum('global','custom') NOT NULL DEFAULT 'global',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
INSERT INTO `rewards` VALUES (1,'One-Day Work From Home','1. The pass can be redeemed with a minimum of 24 hours’ notice, subject to approval based on work schedules and team availability.\r\n2. Employees must remain accessible and responsive during working hours to ensure collaboration and productivity.\r\n3. All meetings, deadlines, and assigned tasks must be completed as per schedule, just like an in-office workday.\r\n4. The pass cannot be combined with paid leave, sick leave, or other time-off requests to extend a break.\r\n5. On critical business days (such as company-wide events, client meetings, or deadlines), managers may request an alternate WFH date.\r\n6. The pass cannot be transferred or gifted to another employee and is meant for individual use only.\r\n7. Employees must log their working hours and daily progress in the designated system or report to their manager as required.\r\n8. The company reserves the right to suspend or modify this benefit if it is misused or affects business operations.\r\n9. The WFH pass is a privilege aimed at enhancing work-life balance—employees are expected to use it responsibly and ethically.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/4HBcoHXy9HUt-nTcw6tsq.jpg','global','2025-02-26 07:52:09','2025-05-05 11:04:36'),(2,'Flexible Working Hours for a Day','1. Employees must request approval from their immediate manager at least 24 hours in advance to ensure that their schedule adjustment does not impact team operations.\n2. A minimum of 6 hours of productive work must be completed during the day.\n3. Employees must communicate their chosen work hours to their team and manager, ensuring everyone is aligned on availability for meetings or urgent tasks.\n4. Employees should ensure that their flexible working hours do not disrupt team collaboration, meetings, or business-critical activities. Flexibility should enhance productivity, not hinder team efforts.\n5. The Flexible Work Hours Day Pass can be used only once and cannot be combined with other time-off (such as vacation days or sick leave) for extended breaks.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/chtd1Qgh08LRtQK-osiBl.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(3,'Early Leave Pass','1. Employees must request the Early Leave Pass from their immediate manager at least 24 hours in advance, unless it’s an urgent or emergency situation, in which case the manager should be notified as soon as possible.\n2. Early Leave is intended for single-day use and cannot be carried forward to the following days. It is a flexible, one-time benefit within the current workday.\n3. If early leave is granted, employees are expected to be available during core hours (10 AM to 3 PM) for any team-related meetings or business-critical tasks before taking leave.\n4. Employees are expected to ensure that leaving early does not negatively affect team collaboration, project deadlines, or urgent business requirements.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/s5vpNJCOfSwT51qi58ceC.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(4,'Late Start Pass','1. The Late Start Pass allows employees to begin their workday no later than 11 AM. Any start time beyond this must be discussed with the manager to ensure coverage and timely delivery of work.\n2. The Late Start Pass should not affect critical meetings, project deadlines, or essential team collaborations. Employees are responsible for ensuring their tasks and responsibilities are met despite the later start.\n3. Employees must notify their immediate team and manager in advance of their late start, especially if it may impact the flow of team communication or meetings scheduled earlier in the day.\n4. The Late Start Pass is for single-day use only and cannot be accumulated or carried forward to another day. It is to be utilized only on specific occasions when needed.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/5eEDcRinmfdZ-ydwTvraH.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(5,'One Day Leave Pass','1. Employees must request the One-Day Leave pass at least 24 hours in advance unless there are exceptional, unforeseen circumstances. This ensures that the leave is properly managed and does not disrupt the flow of work.\n2. Employees are required to inform their direct manager and relevant team members as soon as possible upon approval of the leave to ensure minimal disruption to projects, deadlines, or meetings.\n3. It is the responsibility of the employee to ensure that their workload is effectively managed and that any urgent tasks are delegated or completed prior to taking the leave. The One-Day Leave pass should not result in project delays or bottlenecks.\n4. The One-Day Leave pass is non-transferable.\n5. While no formal documentation is required for a single day of leave, employees are expected to ensure that their absence is communicated clearly and that any necessary handovers are completed to ensure smooth continuity of operations.\n6. Employees will receive full remuneration for the day taken off under the One-Day Leave pass, in line with their regular pay schedule.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/RxqYvvCi_S_8pWDaw8Vby.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(6,'Meeting Free Day','1. Employees must request the Meeting-Free Day at least 48 hours in advance through the appropriate internal platform or system. This ensures proper planning and avoids scheduling conflicts for critical meetings.\n2. Certain mandatory or critical meetings (e.g., client meetings, team check-ins, urgent crisis meetings) may be exempt from the Meeting-Free Day benefit.\n3. Employees are responsible for ensuring that any urgent meetings or discussions are either rescheduled or addressed before the designated Meeting-Free Day. Meeting-Free Days must be planned around critical deadlines and collaborative team activities.\n4. The Meeting-Free Day cannot be transferred to another employee or rolled over to the next quarter.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/Gj4wkg7sM3vPLesVXMznF.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(7,'Surprise Half Day','1. Half-Days are offered at the discretion of the management as a reward or motivational tool. Employees are not required to request or apply for this benefit.\n2. Employees will be notified of the Surprise Half-Day at least 2 hours before the end of the workday. This notice ensures that employees can plan their tasks accordingly, while also maintaining operational efficiency.\n3. Employees who are on leave, business travel, or critical assignments on the day of the surprise half-day will be excluded.\n4. Employees are free to leave after being notified, but must ensure that any necessary communications or immediate tasks are addressed before leaving.\n5. Employees should inform their colleagues and teams promptly upon receiving a Surprise Half-Day so that the workflow can be adjusted as needed.\n6. Employees will receive full remuneration for the day of the Surprise Half-Day, as it is considered part of the regular work schedule.\n7. The Surprise Half-Day will not be deducted from the employee’s annual leave balance. It is treated as an additional benefit provided by the company to encourage well-being.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/KKDD7fOPr2YKySK-TnabU.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(8,'1-on-1 mentorship session with a Senior Executive','1. The session will be scheduled based on availability and priority.\n2. The pass holder should ensure they are punctual and prepared for the session to maximize its effectiveness.\n3. The pass holder should actively engage by asking relevant questions, sharing their experiences, and taking notes for future reference.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/YABd4gx1jAC7a6XJVa2e_.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(18,'helloe','hedcbehjc','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/BBQBQUE8RNUYjzvREuK5z.jpg','custom','2025-05-23 06:28:54','2025-05-23 06:28:54');
/*!40000 ALTER TABLE `rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roi_metrics`
--

DROP TABLE IF EXISTS `roi_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roi_metrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `wellbeing_index` float DEFAULT '0',
  `total_users` int DEFAULT '0',
  `active_users` int DEFAULT '0',
  `roi_value` float DEFAULT '0',
  `rewards_points` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `roi_metrics_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roi_metrics`
--

LOCK TABLES `roi_metrics` WRITE;
/*!40000 ALTER TABLE `roi_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `roi_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'superadmin',NULL,'2025-01-08 10:39:44','2025-01-08 10:39:44'),(2,'admin',NULL,'2025-01-10 09:38:42','2025-01-10 09:38:42'),(3,'employee',NULL,'2025-01-10 09:38:57','2025-01-10 09:38:57'),(4,'therapist',NULL,'2025-01-24 04:48:19','2025-01-24 04:48:19');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `soundscape_likes`
--

DROP TABLE IF EXISTS `soundscape_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soundscape_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `soundscape_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_soundscape` (`user_id`,`soundscape_id`),
  KEY `soundscape_id` (`soundscape_id`),
  CONSTRAINT `soundscape_likes_ibfk_1` FOREIGN KEY (`soundscape_id`) REFERENCES `soundscapes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `soundscape_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soundscape_likes`
--

LOCK TABLES `soundscape_likes` WRITE;
/*!40000 ALTER TABLE `soundscape_likes` DISABLE KEYS */;
INSERT INTO `soundscape_likes` VALUES (18,110,31,'2025-04-24 07:04:29'),(20,109,30,'2025-04-24 07:17:27'),(21,109,32,'2025-04-24 07:17:28'),(23,110,30,'2025-04-24 07:24:00'),(24,109,31,'2025-04-24 07:24:53'),(25,204,31,'2025-05-22 11:29:55');
/*!40000 ALTER TABLE `soundscape_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `soundscapes`
--

DROP TABLE IF EXISTS `soundscapes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `soundscapes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `artist_name` varchar(150) NOT NULL,
  `sound_file_url` varchar(255) NOT NULL,
  `file_size` int unsigned DEFAULT NULL COMMENT 'File size in bytes',
  `duration` decimal(10,2) DEFAULT NULL COMMENT 'Sound duration in seconds with 2 decimal precision',
  `sound_cover_image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tags` json DEFAULT NULL,
  `categories` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soundscapes`
--

LOCK TABLES `soundscapes` WRITE;
/*!40000 ALTER TABLE `soundscapes` DISABLE KEYS */;
INSERT INTO `soundscapes` VALUES (23,'The Sound Of Life','Business Star','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/ZnUs7Haelb_ciVeVVJ4Rz.mp3',7066853,220.84,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/o2RWFydho9D-DJ-Xr0q5F.webp',1,'2025-04-03 06:21:03','2025-04-03 06:21:03','[\"Electronic\", \"Ambient\"]','mind'),(25,'Ocean Waves','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/utFJZqv1dh9SGIqbkYHyL.mp3',2278656,71.21,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/DU15wRTsp0qhaFa0kgvi5.jpg',1,'2025-04-14 06:14:42','2025-04-14 06:14:42','[\"Ocean, Waves\"]','mind'),(26,'Uplift','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/2n_nkEDCTf6KR5I2ffOCI.mp3',10067800,314.62,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/JGPqR4ym82gNBq5LqF4rV.jpg',1,'2025-04-14 06:16:30','2025-04-14 06:16:30','[\"Uplioft, Mind, Focus\"]','focus'),(27,'Zen Garden','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/S4tNfr2QsHOQIUXLytjIu.mp3',4233017,105.80,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/XOg4JvSB0CqaOuNCN-B2x.jpg',1,'2025-04-14 06:18:52','2025-04-14 06:18:52','[\"Garden, Relax\"]','focus'),(28,'Intersteller Jouney','Intersteller','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/MCL_QkTg62Y8Mue2ZQ9RM.mp3',4507814,112.67,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/RXxhuLONRTsCKoTmHq7d3.jpg',1,'2025-04-14 06:20:28','2025-04-14 06:20:28','[\"Intersteller, Space, focus\"]','focus'),(29,'Morning Garden','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/qDfNPkX2Yit6y8qoA8KO-.mp3',6815242,212.98,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/ylzkAthms3S4aTubjiQwr.jpg',1,'2025-04-14 06:24:34','2025-04-14 06:24:34','[\"Morning, yoga, focus\"]','relax'),(30,'Under Water','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/BMjQEJ3Rz6yNfaTOIqt76.mp3',2400960,120.05,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/VuWMV55kiRNh2SxypKs_X.jpg',1,'2025-04-14 06:26:29','2025-04-14 06:26:29','[\"Under water\", \"Ocean\", \"Sea\"]','relax'),(31,'Pure Focus','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/L5R5V332ekXjq0qi4kT8f.mp3',3007603,187.69,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/7_LvZwZ0ML9ypBs-mI9m2.jpg',1,'2025-04-14 06:27:46','2025-04-14 06:27:46','[\"Focus\", \"Relax\", \"Memory\"]','mind'),(32,'Unwind','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/XA0-mZRvF471JmKCTIwGt.mp3',18490514,577.83,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/WoWQtV4LogvCrMPC_qtM0.jpg',1,'2025-04-14 06:28:55','2025-04-14 06:28:55','[\"Mind\", \"Relax\", \"Focus\"]','mind'),(33,'Enchanted Forest','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/k8Vmby09fZmOaLmdYPM_X.mp3',7611872,237.87,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/zFzuGNqObRyOx3TAV5f_m.jpg',1,'2025-04-14 06:30:04','2025-04-14 06:30:04','[\"Forest\"]','mind');
/*!40000 ALTER TABLE `soundscapes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `therapist_slots`
--

DROP TABLE IF EXISTS `therapist_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `therapist_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `therapist_id` int NOT NULL,
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `is_booked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `therapist_id` (`therapist_id`),
  CONSTRAINT `therapist_slots_ibfk_1` FOREIGN KEY (`therapist_id`) REFERENCES `therapists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `therapist_slots`
--

LOCK TABLES `therapist_slots` WRITE;
/*!40000 ALTER TABLE `therapist_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `therapist_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `therapists`
--

DROP TABLE IF EXISTS `therapists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `therapists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `bio` text,
  `specialization` varchar(150) DEFAULT NULL,
  `years_of_experience` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `designation` varchar(100) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `therapists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `therapists`
--

LOCK TABLES `therapists` WRITE;
/*!40000 ALTER TABLE `therapists` DISABLE KEYS */;
/*!40000 ALTER TABLE `therapists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_assessment_responses`
--

DROP TABLE IF EXISTS `user_assessment_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_assessment_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_assessment_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_options` json NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `points` decimal(4,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_assessment_id` (`user_assessment_id`),
  KEY `idx_question_id` (`question_id`),
  CONSTRAINT `fk_user_assessment_responses_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_assessment_responses_user_assessment` FOREIGN KEY (`user_assessment_id`) REFERENCES `user_assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=277 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_assessment_responses`
--

LOCK TABLES `user_assessment_responses` WRITE;
/*!40000 ALTER TABLE `user_assessment_responses` DISABLE KEYS */;
INSERT INTO `user_assessment_responses` VALUES (222,74,11,'[29]',0,0.00,'2025-05-13 11:31:39'),(223,74,12,'[32]',0,0.00,'2025-05-13 11:31:39'),(224,74,13,'[37]',0,0.00,'2025-05-13 11:31:39'),(225,74,14,'[41]',0,0.00,'2025-05-13 11:31:39'),(226,74,15,'[45]',0,0.00,'2025-05-13 11:31:39'),(227,74,16,'[49]',0,0.00,'2025-05-13 11:31:39'),(228,75,17,'[53]',0,0.00,'2025-05-13 11:31:51'),(229,75,18,'[56]',0,0.00,'2025-05-13 11:31:51'),(230,75,19,'[60]',0,0.00,'2025-05-13 11:31:51'),(231,75,20,'[64]',0,0.00,'2025-05-13 11:31:51'),(232,75,21,'[69]',0,0.00,'2025-05-13 11:31:51'),(233,75,22,'[72]',0,0.00,'2025-05-13 11:31:51'),(259,81,122,'[491]',0,2.00,'2025-05-21 09:46:52'),(261,83,127,'[509]',0,4.00,'2025-05-21 09:54:26'),(262,83,128,'[513]',0,4.00,'2025-05-21 09:54:26'),(263,84,135,'[535]',0,5.00,'2025-05-21 11:24:34'),(264,84,136,'[544]',0,1.00,'2025-05-21 11:24:34'),(265,85,122,'[490]',0,3.00,'2025-05-22 07:48:13'),(266,86,122,'[491]',0,2.00,'2025-05-22 10:48:13'),(267,87,137,'[545]',0,4.00,'2025-05-22 12:46:21'),(268,87,138,'[549]',0,4.00,'2025-05-22 12:46:21'),(269,87,139,'[555]',0,2.00,'2025-05-22 12:46:21'),(270,87,140,'[559]',0,2.00,'2025-05-22 12:46:21'),(271,87,141,'[562]',0,3.00,'2025-05-22 12:46:21'),(272,88,137,'[546]',0,3.00,'2025-05-23 08:47:32'),(273,88,138,'[549]',0,4.00,'2025-05-23 08:47:32'),(274,88,139,'[554]',0,3.00,'2025-05-23 08:47:32'),(275,88,140,'[559]',0,2.00,'2025-05-23 08:47:32'),(276,88,141,'[562]',0,3.00,'2025-05-23 08:47:32');
/*!40000 ALTER TABLE `user_assessment_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_assessments`
--

DROP TABLE IF EXISTS `user_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assessment_id` int NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `responses` json DEFAULT NULL,
  `score` float DEFAULT NULL,
  `total_points` float DEFAULT NULL,
  `max_possible_points` float DEFAULT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `user_assessments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_assessments_ibfk_2` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_assessments_ibfk_3` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_assessments`
--

LOCK TABLES `user_assessments` WRITE;
/*!40000 ALTER TABLE `user_assessments` DISABLE KEYS */;
INSERT INTO `user_assessments` VALUES (74,23,110,7,'2025-05-13 11:31:39','[{\"question_id\": 11, \"selected_options\": [29]}, {\"question_id\": 12, \"selected_options\": [32]}, {\"question_id\": 13, \"selected_options\": [37]}, {\"question_id\": 14, \"selected_options\": [41]}, {\"question_id\": 15, \"selected_options\": [45]}, {\"question_id\": 16, \"selected_options\": [49]}]',0,NULL,NULL,NULL),(75,23,110,8,'2025-05-13 11:31:51','[{\"question_id\": 17, \"selected_options\": [53]}, {\"question_id\": 18, \"selected_options\": [56]}, {\"question_id\": 19, \"selected_options\": [60]}, {\"question_id\": 20, \"selected_options\": [64]}, {\"question_id\": 21, \"selected_options\": [69]}, {\"question_id\": 22, \"selected_options\": [72]}]',0,NULL,NULL,NULL),(81,23,110,28,'2025-05-21 09:46:52','[{\"question_id\": 122, \"selected_options\": [491]}]',66.6667,2,3,'https://neure-staging.s3.ap-south-1.amazonaws.com/assessments/report_110_20250521110905797.pdf'),(83,23,110,26,'2025-05-21 09:54:26','[{\"question_id\": 127, \"selected_options\": [509]}, {\"question_id\": 128, \"selected_options\": [513]}]',100,8,8,'https://neure-staging.s3.ap-south-1.amazonaws.com/assessments/Test_with_points_and_range/user_110_20250521104921823.pdf'),(84,23,110,30,'2025-05-21 11:24:34','[{\"question_id\": 135, \"selected_options\": [535]}, {\"question_id\": 136, \"selected_options\": [544]}]',60,6,10,'https://neure-staging.s3.ap-south-1.amazonaws.com/assessments/report_110_20250521114405144.pdf'),(85,23,199,28,'2025-05-22 07:48:13','[{\"question_id\": 122, \"selected_options\": [490]}]',100,3,3,NULL),(86,50,205,28,'2025-05-22 10:48:13','[{\"question_id\": 122, \"selected_options\": [491]}]',66.6667,2,3,NULL),(87,50,205,31,'2025-05-22 12:46:21','[{\"question_id\": 137, \"selected_options\": [545]}, {\"question_id\": 138, \"selected_options\": [549]}, {\"question_id\": 139, \"selected_options\": [555]}, {\"question_id\": 140, \"selected_options\": [559]}, {\"question_id\": 141, \"selected_options\": [562]}]',75,15,20,NULL),(88,50,213,31,'2025-05-23 08:47:32','[{\"question_id\": 137, \"selected_options\": [546]}, {\"question_id\": 138, \"selected_options\": [549]}, {\"question_id\": 139, \"selected_options\": [554]}, {\"question_id\": 140, \"selected_options\": [559]}, {\"question_id\": 141, \"selected_options\": [562]}]',75,15,20,NULL);
/*!40000 ALTER TABLE `user_assessments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_departments`
--

DROP TABLE IF EXISTS `user_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_departments` (
  `user_id` int NOT NULL,
  `department_id` int NOT NULL,
  `assigned_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `unique_user_department` (`user_id`),
  KEY `unique_user_department_fk_department` (`department_id`),
  CONSTRAINT `unique_user_department_fk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_departments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_departments`
--

LOCK TABLES `user_departments` WRITE;
/*!40000 ALTER TABLE `user_departments` DISABLE KEYS */;
INSERT INTO `user_departments` VALUES (110,1,'2025-04-21 06:28:48'),(199,7,'2025-05-22 06:26:10'),(205,7,'2025-05-22 10:13:03'),(206,4,'2025-05-22 11:07:01'),(207,3,'2025-05-22 11:07:01'),(208,2,'2025-05-22 11:07:02'),(209,1,'2025-05-22 11:07:02'),(210,5,'2025-05-22 11:07:03'),(213,4,'2025-05-23 04:22:47'),(218,7,'2025-05-23 10:57:50'),(219,2,'2025-05-26 05:33:28');
/*!40000 ALTER TABLE `user_departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_resource_tracking`
--

DROP TABLE IF EXISTS `user_resource_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_resource_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `resource_type` enum('article','gallery_image','gallery_video','gallery_document','soundscape') NOT NULL,
  `resource_id` int NOT NULL,
  `action_type` enum('view') NOT NULL,
  `action_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `resource_type` (`resource_type`),
  KEY `action_timestamp` (`action_timestamp`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_resource_tracking`
--

LOCK TABLES `user_resource_tracking` WRITE;
/*!40000 ALTER TABLE `user_resource_tracking` DISABLE KEYS */;
INSERT INTO `user_resource_tracking` VALUES (9,110,'gallery_image',9,'view','2025-04-21 10:05:58'),(10,110,'gallery_image',10,'view','2025-04-21 10:06:04'),(11,110,'gallery_document',4,'view','2025-04-21 10:06:08'),(12,110,'gallery_document',4,'view','2025-04-21 10:06:16'),(13,110,'gallery_video',24,'view','2025-04-21 10:06:26'),(14,110,'gallery_video',22,'view','2025-04-21 10:06:30'),(15,110,'gallery_image',10,'view','2025-04-21 10:07:40'),(16,110,'gallery_image',9,'view','2025-04-21 10:11:27'),(17,110,'gallery_image',10,'view','2025-04-21 10:11:31'),(18,110,'gallery_image',10,'view','2025-04-21 10:20:05'),(19,110,'gallery_image',10,'view','2025-04-29 05:23:57'),(20,110,'gallery_video',24,'view','2025-04-29 05:23:57'),(21,110,'gallery_video',24,'view','2025-04-29 05:23:58'),(22,110,'gallery_video',24,'view','2025-04-29 05:24:01'),(23,110,'gallery_video',24,'view','2025-04-29 05:24:02'),(24,110,'gallery_document',4,'view','2025-04-29 05:24:08'),(25,110,'gallery_image',10,'view','2025-05-06 11:26:50'),(26,110,'gallery_video',24,'view','2025-05-06 11:28:30'),(27,110,'gallery_video',24,'view','2025-05-06 11:28:35'),(28,110,'gallery_video',22,'view','2025-05-08 12:30:47'),(29,109,'gallery_video',22,'view','2025-05-08 12:30:57'),(30,109,'gallery_video',24,'view','2025-05-08 12:31:13'),(34,199,'gallery_image',33,'view','2025-05-22 08:57:48'),(35,199,'gallery_video',22,'view','2025-05-22 08:57:53'),(36,199,'gallery_video',22,'view','2025-05-22 08:57:57'),(37,110,'gallery_video',22,'view','2025-05-24 10:41:51'),(38,110,'gallery_video',22,'view','2025-05-24 10:41:51'),(39,110,'gallery_document',4,'view','2025-05-24 10:41:55'),(40,110,'gallery_document',4,'view','2025-05-24 10:42:00');
/*!40000 ALTER TABLE `user_resource_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_subscriptions`
--

DROP TABLE IF EXISTS `user_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email_notification` tinyint(1) NOT NULL DEFAULT '0',
  `sms_notification` tinyint(1) NOT NULL DEFAULT '0',
  `workshop_event_reminder` tinyint(1) NOT NULL DEFAULT '0',
  `system_updates_announcement` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  CONSTRAINT `fk_user_subscriptions` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_subscriptions`
--

LOCK TABLES `user_subscriptions` WRITE;
/*!40000 ALTER TABLE `user_subscriptions` DISABLE KEYS */;
INSERT INTO `user_subscriptions` VALUES (10,109,1,1,1,1,'2025-04-21 06:26:29','2025-04-21 06:26:29'),(11,110,0,0,1,1,'2025-04-21 06:28:48','2025-04-22 11:06:28'),(12,111,1,1,1,1,'2025-04-22 05:40:50','2025-04-22 05:40:50'),(21,126,1,1,1,1,'2025-05-07 09:53:03','2025-05-07 09:53:03'),(22,129,1,1,1,1,'2025-05-07 09:55:49','2025-05-07 09:55:49'),(55,199,1,1,1,1,'2025-05-22 06:26:10','2025-05-22 06:26:10'),(58,204,1,1,1,1,'2025-05-22 09:43:20','2025-05-22 09:43:20'),(59,205,0,1,0,1,'2025-05-22 10:13:03','2025-05-22 11:46:18'),(60,206,1,1,1,1,'2025-05-22 11:07:01','2025-05-22 11:07:01'),(61,207,1,1,1,1,'2025-05-22 11:07:01','2025-05-22 11:07:01'),(62,208,1,1,1,1,'2025-05-22 11:07:02','2025-05-22 11:07:02'),(63,209,1,1,1,1,'2025-05-22 11:07:02','2025-05-22 11:07:02'),(64,210,1,1,1,1,'2025-05-22 11:07:03','2025-05-22 11:07:03'),(67,213,1,1,1,1,'2025-05-23 04:22:47','2025-05-23 04:22:47'),(69,217,1,1,1,1,'2025-05-23 10:54:39','2025-05-23 10:54:39'),(70,218,1,1,1,1,'2025-05-23 10:57:49','2025-05-23 10:57:49'),(71,219,1,1,1,1,'2025-05-26 05:33:28','2025-05-26 05:33:28');
/*!40000 ALTER TABLE `user_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `age` int DEFAULT NULL,
  `profile_url` varchar(255) DEFAULT NULL,
  `Workshop_attended` int DEFAULT '0',
  `Task_completed` int DEFAULT '0',
  `EngagementScore` int DEFAULT '0',
  `accepted_terms` tinyint(1) DEFAULT '0',
  `job_title` varchar(100) DEFAULT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `last_stress_modal_seen_at` datetime DEFAULT NULL,
  `has_seen_dashboard_tour` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,'supadmin@gmail.com','7894561230','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','Chandan','Chandan','Yadav','other','Thane','2001-05-28',24,NULL,0,0,0,0,NULL,1,1,'2025-05-26 10:44:55',NULL,0,'2025-03-21 07:10:47','2025-05-26 10:44:55'),(109,'20102082.chandan.yadav@gmail.com','8454883225','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','chandanyadav1','Chandan','Yadav','male',NULL,NULL,NULL,NULL,0,0,0,1,'SDE-1',2,1,'2025-05-26 09:15:15',NULL,1,'2025-04-19 15:56:29','2025-05-26 09:15:15'),(110,'ricky@gmail.com','1122344556','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','rickjoy','Rick','harry','male','','2025-04-10',0,NULL,0,0,0,1,'IDK',3,1,'2025-05-26 06:37:32','2025-05-05 05:35:59',1,'2025-04-21 06:28:48','2025-05-26 06:37:32'),(111,'varun@neure.co.in','8850352266','$2b$10$zzrbfoRKdtEPy/58GGJehuVzGSa8fNdUPEpugtnZiO12BY/7JP0BS','varunpatel','Varun','Patel','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-04-22 05:40:50','2025-04-22 05:40:50'),(126,'yash@starbucks.in','1234567890','$2b$10$U/zeRJ/XCKAfxusgFXQ0rOgdFAzo/BCz8DkQHGSGrXRFTAAcJsFtK','yashpatel','Yash','Patel','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-05-07 09:53:03','2025-05-07 09:53:03'),(129,'yash@abc.in','19191919191','$2b$10$cWPRX/PFKz8c9JZmAqKDj.f7toFJe9qgPBnK6i97v2ArlpUSluBJ2','yashpatel1','Yash','Patel','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-05-07 09:55:49','2025-05-07 09:55:49'),(199,'chandan.yadav@gmail.com','8454883226','$2b$10$nrihUS4jLD.57BWy1OaldeLoRL/orJJ4CMmRn.5l7w3VCNC8AJL5W','chandanyadav3','Chandan','Yadav','male',NULL,'2001-05-29',23,NULL,0,0,0,1,'FullStack Developer',3,1,'2025-05-22 07:35:32','2025-05-22 06:35:32',1,'2025-05-22 06:26:10','2025-05-22 10:12:30'),(204,'c2905y@gmail.com','8454883226','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','veermalhotra','Veer','Malhotra','male',NULL,NULL,NULL,NULL,0,0,0,1,NULL,2,1,'2025-05-23 06:30:36',NULL,1,'2025-05-22 09:43:20','2025-05-23 06:30:36'),(205,'chandan.yadav29@gmail.com','7788990055','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','chandanyadav4','Chandan','Yadav','male',NULL,'2001-05-01',24,'https://neure-staging.s3.ap-south-1.amazonaws.com/images/profiles/Wn0uecOcqrztYfUcyDy-d.jpg',0,0,0,1,'SDE',3,1,'2025-05-26 06:31:37','2025-05-22 10:20:43',1,'2025-05-22 10:13:03','2025-05-26 06:31:37'),(206,'prem@gmail.com','1234567890','$2b$10$X7qOORL0tuMoKghajBFcSu8oAwvwHsZGjC0VKoAuyUxBi2jNSihca','prem.chopra','Prem','Chopra','male','Thane','2025-04-15',0,NULL,0,0,0,0,NULL,3,1,NULL,NULL,0,'2025-05-22 11:07:01','2025-05-22 11:07:01'),(207,'radha@gmail.com','9876543210','$2b$10$kyNLB1900vickqEbDXGxhuh3d/OXgAoz13BxMDt1EnzSFIsD5YE1W','radha.kapoor','Radha','Kapoor','female','Mumbai','1990-06-10',34,NULL,0,0,0,0,'Designer',3,1,NULL,NULL,0,'2025-05-22 11:07:01','2025-05-22 11:07:01'),(208,'amit@gmail.com','1231231231','$2b$10$AmSkLzGKfZqMywWTarAqeOpwm0Met2aIwS78QtQ3iUNAWXjL1ffZq','amit.verma','Amit','Verma','male','Pune','1988-12-22',36,NULL,0,0,0,0,'Engineer',3,1,NULL,NULL,0,'2025-05-22 11:07:02','2025-05-22 11:07:02'),(209,'sneha@gmail.com','9090909090','$2b$10$GA0G9zzN0z1cQ3e1MlVXFeLDugAiBLm1RDQHTKuA6nZi3WjlL/XRK','sneha.singh','Sneha','Singh','female','Nashik','1995-08-05',29,NULL,0,0,0,0,'Manager',3,1,NULL,NULL,0,'2025-05-22 11:07:02','2025-05-22 11:07:02'),(210,'rahul@gmail.com','8080808080','$2b$10$HOWHjdN7FongBe5L1n4fR.KMtGpqAEfl2rAv7JZd9T6f4kw/dRNtS','rahul.jain','Rahul','Jain','male','Nagpur','1992-03-17',33,NULL,0,0,0,0,'Analyst',3,1,NULL,NULL,0,'2025-05-22 11:07:02','2025-05-22 11:07:02'),(213,'20102082@gmail.com','3232323232','$2b$10$0Xi3KVP66r33fqXuw8qyTeNow7izc0QYKsim/vDsgqC0BsTV4NtSS','praveenshinde','Praveen','Shinde','male',NULL,'2004-05-22',21,NULL,0,0,0,1,'FullStack Developer',3,1,'2025-05-23 04:53:10','2025-05-23 04:53:44',1,'2025-05-23 04:22:47','2025-05-26 05:06:54'),(217,'abcd@gmail.com','1234567890','$2b$10$aztiY.AlFPM9es.KVRn6RuYTNmEH007Q3jUx5gT7KcLUqJkr2KYq.','johncolen','john','colen','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-05-23 10:54:39','2025-05-23 10:54:39'),(218,'xyz@gmail.com','1234567890','$2b$10$TvKMHLiRN9L6nTt7jpVFqeAh9NSjcXCIbsPl9PRMKPvqlQsduXUFe','abcxyz','abc','xyz','male',NULL,'2005-05-03',20,NULL,0,0,0,0,'IDK',3,1,NULL,NULL,0,'2025-05-23 10:57:49','2025-05-23 10:57:49'),(219,'chandanyadav290501@gmail.com','1122344556','$2b$10$KSOA.EAWXtmaYiH3Djm7H.KPk78BjPKaAiHAe.BwCAFcGwOOD5AR2','chandanyadav','Chandan','Yadav','male',NULL,'2001-05-29',23,NULL,0,0,0,0,'IDK',3,1,NULL,NULL,0,'2025-05-26 05:33:28','2025-05-26 05:33:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worksheets`
--

DROP TABLE IF EXISTS `worksheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worksheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workshop_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workshop_id` (`workshop_id`),
  CONSTRAINT `worksheets_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worksheets`
--

LOCK TABLES `worksheets` WRITE;
/*!40000 ALTER TABLE `worksheets` DISABLE KEYS */;
/*!40000 ALTER TABLE `worksheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshop_schedules`
--

DROP TABLE IF EXISTS `workshop_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshop_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workshop_id` int NOT NULL,
  `company_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `host_name` varchar(255) DEFAULT NULL,
  `status` enum('scheduled','cancelled','completed','rescheduled') DEFAULT 'scheduled',
  `max_participants` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workshop_id` (`workshop_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `workshop_schedules_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workshop_schedules_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshop_schedules`
--

LOCK TABLES `workshop_schedules` WRITE;
/*!40000 ALTER TABLE `workshop_schedules` DISABLE KEYS */;
INSERT INTO `workshop_schedules` VALUES (57,29,23,'2025-05-15 14:00:00','2025-05-15 18:00:00',240,'rahul','rescheduled',NULL,'2025-05-15 08:14:31'),(67,29,24,'2025-05-14 04:00:00','2025-05-14 06:00:00',120,'Pravven Sonesha','scheduled',NULL,'2025-05-09 10:33:19'),(89,33,50,'2025-05-22 18:00:00','2025-05-22 20:00:00',120,'Pravven Sonesha','completed',NULL,'2025-05-22 12:06:46'),(90,36,50,'2025-05-23 16:00:00','2025-05-23 18:00:00',120,'Pravven Sonesha','scheduled',NULL,'2025-05-23 07:15:17'),(97,33,51,'2025-05-26 14:31:04','2025-05-26 16:31:04',120,'Pravven Sonesha','scheduled',NULL,'2025-05-26 09:01:08'),(98,33,51,'2025-05-26 14:34:30','2025-05-26 15:34:30',60,'Chandan','scheduled',NULL,'2025-05-26 09:04:35');
/*!40000 ALTER TABLE `workshop_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshop_tickets`
--

DROP TABLE IF EXISTS `workshop_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshop_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workshop_id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `ticket_code` varchar(50) NOT NULL,
  `is_attended` tinyint(1) DEFAULT '0',
  `pdf_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `schedule_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `idx_ticket_code` (`ticket_code`),
  KEY `idx_workshop_user` (`workshop_id`,`user_id`),
  KEY `fk_workshop_company` (`company_id`),
  KEY `idx_workshop_tickets_schedule` (`schedule_id`),
  KEY `workshop_tickets_ibfk_2` (`user_id`),
  CONSTRAINT `fk_workshop_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `fk_workshop_ticket_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `workshop_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `workshop_tickets_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workshop_tickets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshop_tickets`
--

LOCK TABLES `workshop_tickets` WRITE;
/*!40000 ALTER TABLE `workshop_tickets` DISABLE KEYS */;
INSERT INTO `workshop_tickets` VALUES (38,29,110,23,'NEUT32TTKE',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Rick_harry_NEUT32TTKE.pdf','2025-04-30 11:46:31','2025-05-12 05:59:03',57),(39,29,109,23,'NEUT31JJZI',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Chandan_Jadhav_NEUT31JJZI.pdf','2025-04-30 11:46:31','2025-05-12 05:02:01',57),(40,29,110,23,'NEUT32XQJ0',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Rick_harry_NEUT32XQJ0.pdf','2025-04-30 11:56:47','2025-05-12 07:03:29',57),(41,29,109,23,'NEUT31EMJV',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Chandan_Jadhav_NEUT31EMJV.pdf','2025-04-30 11:56:47','2025-05-12 05:02:01',57),(79,33,208,50,'NEUX5S2HDXHA',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Amit_Verma_NEUX5S2HDXHA.pdf','2025-05-22 11:54:19','2025-05-22 11:54:41',89),(80,33,210,50,'NEUX5U2HVDCK',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Rahul_Jain_NEUX5U2HVDCK.pdf','2025-05-22 11:54:19','2025-05-22 11:54:41',89),(81,33,207,50,'NEUX5R2HVCTO',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Radha_Kapoor_NEUX5R2HVCTO.pdf','2025-05-22 11:54:19','2025-05-22 11:56:31',89),(82,33,205,50,'NEUX5P2HLMMG',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Chandan_Yadav_NEUX5P2HLMMG.pdf','2025-05-22 11:54:19','2025-05-22 11:56:58',89),(83,33,206,50,'NEUX5Q2HNM5W',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Prem_Chopra_NEUX5Q2HNM5W.pdf','2025-05-22 11:54:19','2025-05-22 11:57:27',89),(84,33,209,50,'NEUX5T2HY4QC',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Workshop by Bitroot/Sneha_Singh_NEUX5T2HY4QC.pdf','2025-05-22 11:54:19','2025-05-22 11:55:47',89),(85,36,206,50,'NEU105Q2IWA2Z',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Prem_Chopra_NEU105Q2IWA2Z.pdf','2025-05-23 07:15:17','2025-05-23 07:15:34',90),(86,36,209,50,'NEU105T2IONFE',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Sneha_Singh_NEU105T2IONFE.pdf','2025-05-23 07:15:17','2025-05-23 07:15:33',90),(87,36,205,50,'NEU105P2IXIFU',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Chandan_Yadav_NEU105P2IXIFU.pdf','2025-05-23 07:15:17','2025-05-23 07:15:34',90),(88,36,210,50,'NEU105U2I9DYQ',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Rahul_Jain_NEU105U2I9DYQ.pdf','2025-05-23 07:15:17','2025-05-23 07:15:33',90),(90,36,208,50,'NEU105S2IN-I-',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Amit_Verma_NEU105S2IN-I-.pdf','2025-05-23 07:15:17','2025-05-23 07:15:34',90),(91,36,213,50,'NEU105X2IOK2D',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Praveen_Shinde_NEU105X2IOK2D.pdf','2025-05-23 07:15:17','2025-05-23 07:15:34',90),(92,36,207,50,'NEU105R2I8CJQ',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Fitnova/Sharpen Your Focus: Mastering the Art of Deep Work/Radha_Kapoor_NEU105R2I8CJQ.pdf','2025-05-23 07:15:17','2025-05-23 07:15:33',90),(101,33,218,51,'NEUX622PPF6V',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TestForTemplate/Workshop_by_Bitroot/abc_xyz_NEUX622PPF6V.pdf','2025-05-26 09:01:08','2025-05-26 09:01:10',97),(102,33,219,51,'NEUX632P9-JT',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TestForTemplate/Workshop_by_Bitroot/Chandan_Yadav_NEUX632P9-JT.pdf','2025-05-26 09:01:08','2025-05-26 09:01:10',97),(103,33,218,51,'NEUX622QWWRD',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TestForTemplate/Workshop_by_Bitroot/abc_xyz_NEUX622QWWRD.pdf','2025-05-26 09:04:35','2025-05-26 09:04:37',98),(104,33,219,51,'NEUX632QXAHA',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TestForTemplate/Workshop_by_Bitroot/Chandan_Yadav_NEUX632QXAHA.pdf','2025-05-26 09:04:35','2025-05-26 09:04:36',98);
/*!40000 ALTER TABLE `workshop_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workshops`
--

DROP TABLE IF EXISTS `workshops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workshops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text,
  `agenda` text,
  `conference_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `folder_path` varchar(255) DEFAULT NULL,
  `poster_image` varchar(255) DEFAULT NULL,
  `pdf_url` varchar(255) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `rating_count` int DEFAULT '0',
  `pdf_generated` tinyint(1) DEFAULT '0',
  `pdf_generated_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshops`
--

LOCK TABLES `workshops` WRITE;
/*!40000 ALTER TABLE `workshops` DISABLE KEYS */;
INSERT INTO `workshops` VALUES (19,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:55','2025-04-22 05:22:55'),(21,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:57','2025-04-22 05:22:57'),(25,'Hello','fghvbjknm,','wdefrvd',NULL,NULL,NULL,NULL,NULL,0.00,0,0,NULL,0,'2025-04-30 10:15:05','2025-04-30 10:36:11'),(26,'Hello','fghvbjknm,','wdefrvd',NULL,NULL,NULL,NULL,NULL,0.00,0,0,NULL,0,'2025-04-30 10:17:27','2025-04-30 10:35:36'),(29,'Prioritizing Mental Health in the Workplace','Join us for an insightful session focused on understanding, managing, and supporting mental health in professional environments. In today\'s fast-paced work culture, mental well-being is just as important as physical health. This event aims to create awareness, reduce stigma, and provide actionable tools to support yourself and your colleagues.','Welcome & Opening Remarks (5 mins)\n\nUnderstanding Mental Health – Common stressors, signs & symptoms (15 mins)\n\nInteractive Activity: Self-Check Exercise (10 mins)\n\nBuilding a Culture of Psychological Safety at Work (15 mins)\n\nMindfulness & Stress-Relief Techniques (10 mins)\n\nQ&A Session / Open Discussion (10 mins)\n\nClosing Notes & Resources for Support (5 mins)',NULL,NULL,NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/29/cover/S4jJsaDeTMhBDJ6wcrQXN.png','https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/29/files/QsRLbQfltIU1-wpSzaG5K.pdf',0.00,0,0,NULL,1,'2025-04-30 11:14:50','2025-05-07 09:59:32'),(33,'Workshop by Bitroot','Workshop by neure','Workshop by neure',NULL,NULL,NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/33/cover/gdjM0i18pSLPmwDYqazLi.png','https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/33/files/tEOV6NmEsfE2FEdclNFGS.pdf',0.00,0,0,NULL,1,'2025-05-15 08:12:05','2025-05-16 11:46:01'),(36,'Sharpen Your Focus: Mastering the Art of Deep Work','This interactive workshop is designed to help participants understand the science of attention, identify their focus killers, and build practical habits to regain control over their mental clarity. Whether you\'re a student, professional, or creative, you’ll walk away with actionable strategies to boost productivity, eliminate mental clutter, and achieve deep work.','Welcome & Icebreaker\nScience of Focus: How attention works\nIdentifying Distractions & Focus Killers\nFocus Techniques: Pomodoro, Time-blocking, Habit stacking\nDigital Hygiene: Reducing screen and notification overload\nMindfulness & Meditation Practices\nLifestyle Factors: Nutrition, Sleep, Movement\nBuilding a Personalized Focus Toolkit\nQ&A and Wrap-up with Resources\n',NULL,NULL,NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/36/cover/27vvPfcwm8Ot6m4PwXAL-.jpg','https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/36/files/7mCVFXibxAWlkDUP8Zmnj.pdf',0.00,0,0,NULL,1,'2025-05-23 07:14:29','2025-05-23 07:14:30');
/*!40000 ALTER TABLE `workshops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'neure'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-26 16:36:42
