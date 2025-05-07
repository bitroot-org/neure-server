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
  `performed_by` varchar(50) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_module_name` (`module_name`),
  KEY `idx_action` (`action`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_module_action_time` (`module_name`,`action`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,110,'admin@example.com','users','create','Created a new user account','2025-05-05 08:36:16'),(2,110,'admin','workshops','CREATE','Created a new workshop: Mental Wellness 101','2025-05-05 08:39:32'),(3,109,'superadmin','dashboard','DELETE','Removed outdated widget','2025-05-05 08:39:35'),(4,110,'admin','workshops','CREATE','Created workshop: Mindful Breathing Techniques','2025-05-05 08:40:23'),(5,110,'admin','workshop_tickets','UPDATE','Marked ticket as attended for workshop ID 21','2025-05-05 08:40:23'),(6,110,'admin','users','UPDATE','Updated profile info for user_id 210','2025-05-05 08:40:23'),(7,109,'superadmin','dashboard','DELETE','Deleted obsolete dashboard widget','2025-05-05 08:40:26'),(8,109,'superadmin','companies','CREATE','Registered new company: Healthify Corp','2025-05-05 08:40:26'),(9,109,'superadmin','employee_daily_history','INSERT','Added daily metrics for user_id 220','2025-05-05 08:40:26'),(10,110,'user','login','LOGIN','User logged in successfully','2025-05-05 08:40:30'),(11,109,'user','login','LOGOUT','User logged out','2025-05-05 08:40:30'),(12,110,'admin','workshop_schedules','RESCHEDULE','Changed workshop start time from 10:00 to 11:00','2025-05-05 08:40:30'),(13,NULL,'admin','workshops','reschedule','Workshop \"rioritizing Mental Health in the Workplace\" for company \"TheFruit\" rescheduled to 5/7/2025, 4:12:00 AM - 5/7/2025, 7:11:00 AM','2025-05-05 09:29:51'),(14,4,'admin','workshops','reschedule','Workshop \"Unleash your superhero\" (ID: 17) for company \"TheFruit\" (ID: 23) rescheduled from 5/9/2025, 1:00:00 AM-5/9/2025, 6:00:00 AM to 5/12/2025, 2:00:00 AM-5/12/2025, 3:15:40 PM','2025-05-05 09:48:38'),(15,4,'admin','workshops','status_update','Workshop \"Unleash your superhero\" (ID: 17) for company \"TheFruit\" (ID: 23) status changed from \"rescheduled\" to \"cancelled\"','2025-05-05 09:54:08'),(16,4,'admin','workshops','reschedule','Workshop \"Unleash your superhero\" (ID: 17) for company \"TheFruit\" (ID: 23) rescheduled from 5/12/2025, 2:00:00 AM-5/12/2025, 3:15:40 PM to 5/22/2025, 3:00:00 AM-5/22/2025, 7:00:00 AM','2025-05-05 09:57:35'),(17,4,'admin','workshops','cancel','Workshop \"Unleash your superhero\" (ID: 17) for company \"TheFruit\" (ID: 23) scheduled for 5/22/2025, 3:00:00 AM was cancelled','2025-05-05 09:57:38'),(18,4,'admin','companies','create','Company \"Technova\" created with ID 25. Contact person: John Vic (joh@gmail.com)','2025-05-05 10:03:44'),(19,4,'admin','articles','create','Article \"Hello\" created with ID N/A','2025-05-05 10:50:24'),(20,4,'admin','articles','create','Article \"Hello\" created with ID N/A','2025-05-05 10:50:47'),(21,4,'admin','articles','delete','Article \"Hello\" (ID: 41) deleted','2025-05-05 10:50:57'),(22,4,'admin','articles','delete','Article \"Hello\" (ID: 42) deleted','2025-05-05 10:50:59'),(23,4,'admin','articles','create','Article \"hellodjha\" created with ID N/A','2025-05-05 10:54:10'),(24,4,'admin','articles','delete','Article \"hellodjha\" (ID: 43) deleted','2025-05-05 10:54:18'),(25,4,'admin','rewards','update','Reward \"One-Day Work From Home\" (ID: 1) updated. Fields changed: title, terms_and_conditions, reward_type, company_ids. Assigned to company IDs: 23, 1, 2','2025-05-05 10:58:06'),(26,4,'admin','rewards','update','Reward \"One-Day Work From Home\" (ID: 1) updated. Fields changed: title, terms_and_conditions, reward_type (Changed to Global reward)','2025-05-05 10:58:13'),(27,4,'admin','rewards','create','Reward \"dewhdew\" created with ID 15 (Global reward)','2025-05-05 10:58:25'),(28,4,'admin','rewards','delete','Reward \"dewhdew\" (ID: 15) deleted','2025-05-05 10:58:30'),(29,4,'admin','rewards','update','Reward \"One-Day Work From Home\" updated. Changes made to: title, terms and conditions, reward type, assigned companies. Now assigned to companies: Tata Housing Private Limited, Bitroot, TheFruit','2025-05-05 11:04:19'),(30,4,'admin','rewards','update','Reward \"One-Day Work From Home\" updated. Changes made to: title, terms and conditions, reward type. Changed to a Global reward (available to all companies)','2025-05-05 11:04:36'),(31,4,'admin','soundscapes','create','Soundscape \"hgv\" created by artist \"hvgb \" in category \"mind\". Duration: 0:00','2025-05-05 11:21:55'),(32,4,'admin','soundscapes','delete','Soundscape \"hgv\" by artist \"hvgb \" was deleted','2025-05-05 11:22:05'),(33,4,'admin','soundscapes','delete','Soundscape \"hgv\" by artist \"hvgb \" was deleted','2025-05-05 11:22:07'),(34,4,'admin','soundscapes','delete','Soundscape \"hgv\" by artist \"hvgb \" was deleted','2025-05-05 11:22:09'),(35,4,'admin','soundscapes','create','Soundscape \"Rain\" created by artist \"MindMist\" in category \"mind\".','2025-05-05 11:24:22'),(36,4,'admin','soundscapes','delete','Soundscape \"Rain\" by artist \"MindMist\" was deleted','2025-05-05 11:24:30'),(37,NULL,'admin','assessments','create','Assessment \"hjbhj\" created with 1 questions.','2025-05-05 11:30:09'),(38,4,'admin','workshops','schedule','Workshop \"Unleash your superhero\" (ID: 22) scheduled for company \"Technova\" (ID: 25) on 5/10/2025, 1:57:56 PM','2025-05-06 08:28:05'),(39,4,'admin','articles','create','Article \"jhb\" created','2025-05-07 06:24:18'),(40,4,'admin','articles','delete','Article \"jhb\" was deleted','2025-05-07 06:24:32');
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
INSERT INTO `announcement_company` VALUES (1,1,1,'2025-01-20 11:06:40','2025-01-20 11:06:40'),(2,2,1,'2025-01-20 11:06:40','2025-01-20 11:06:40'),(3,3,1,'2025-01-20 11:06:40','2025-01-20 11:06:40'),(22,23,1,'2025-04-22 12:02:27','2025-04-22 12:02:27'),(23,4,1,'2025-04-25 12:21:36','2025-04-25 12:21:36'),(23,23,1,'2025-04-25 12:21:36','2025-04-25 12:21:36'),(24,1,1,'2025-04-25 12:33:23','2025-04-25 12:33:23'),(27,1,1,'2025-04-25 12:51:12','2025-04-25 12:51:12'),(28,1,1,'2025-04-25 12:55:28','2025-04-25 12:55:28'),(30,23,1,'2025-04-25 13:19:37','2025-04-25 13:19:37'),(33,3,1,'2025-05-02 10:59:18','2025-05-02 10:59:18'),(34,1,1,'2025-05-02 11:11:07','2025-05-02 11:11:07'),(34,3,1,'2025-05-02 11:11:07','2025-05-02 11:11:07'),(34,4,1,'2025-05-02 11:11:07','2025-05-02 11:11:07'),(34,5,1,'2025-05-02 11:11:07','2025-05-02 11:11:07');
/*!40000 ALTER TABLE `announcement_company` ENABLE KEYS */;
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
  `audience_type` enum('company','employees','all') NOT NULL DEFAULT 'all',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,'Welcome to TechNova!','We are excited to onboard TechNova. Explore our latest updates.','https://technova.com/updates','company','2025-01-20 11:00:54',1),(2,'HealthifyMe Quarterly Results','Our quarterly results are live. Check them out!','https://healthifyme.com/results','employees','2025-01-20 11:00:54',1),(3,'Bitroot Achievements','Bitroot has achieved a major milestone this year!','https://bitroot.com/achievements','employees','2025-01-20 11:00:54',1),(4,'AgroGrow Pending ','AgroGrow updates will be available soon.','https://agrogrow.net/updates','employees','2025-01-20 11:00:54',1),(5,'FinEdge’s New Launch','FinEdge is launching its new electric car this quarter!','https://finedge.io/electric-car','employees','2025-01-20 11:00:54',1),(22,'Welcome to the world of wellbeing','Hello, welcome to the new world.',NULL,'company','2025-04-22 12:02:27',1),(23,'Hello from neure','hello','youtube.com','company','2025-04-25 12:21:36',0),(24,'hello tata','dsa',NULL,'company','2025-04-25 12:33:23',0),(25,'Hollll','dkcbdns',NULL,'employees','2025-04-25 12:35:53',0),(26,'hello emo','jhb',NULL,'employees','2025-04-25 12:36:57',0),(27,'cjbdsjhc','cd s',NULL,'company','2025-04-25 12:51:12',0),(28,'ferfref','sfcdsvd',NULL,'company','2025-04-25 12:55:28',0),(29,'kdfghcvbd','dcbhsd',NULL,'company','2025-04-25 13:08:53',0),(30,'gvh','nb ',NULL,'employees','2025-04-25 13:19:37',0),(31,'New Workshop Scheduled','We have a new workshop scheduled. Go & check it out.',NULL,'employees','2025-04-29 06:01:50',1),(32,'test ','hbdchjd',NULL,'employees','2025-05-02 10:57:23',0),(33,'hello','fd',NULL,'employees','2025-05-02 10:59:18',0),(34,'hello','hehehehhe','youtube.com','all','2025-05-02 11:11:07',NULL),(35,'sdfjcbdsvghcn','sdbcnmdf n','cfd','all','2025-05-02 11:23:16',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
-- Table structure for table `assessments`
--

DROP TABLE IF EXISTS `assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text,
  `frequency_days` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessments`
--

LOCK TABLES `assessments` WRITE;
/*!40000 ALTER TABLE `assessments` DISABLE KEYS */;
INSERT INTO `assessments` VALUES (7,'General Mental Well-Being Assessment','This assessment evaluates your overall mental health and emotional well-being.',30,1,'2025-04-01 11:57:06'),(8,'Anxiety Level Assessment','This test assesses your anxiety levels and common triggers.',30,1,'2025-04-01 11:58:19'),(9,'Depression Screening Test','This test assesses signs of depression based on common symptoms.',30,1,'2025-04-01 11:59:17'),(10,'Stress Management Assessment','This assessment helps understand your stress levels and how you manage them.',30,1,'2025-04-01 11:59:29'),(11,'Work-Life Balance Assessment','This assessment helps evaluate your balance between work and personal life.',30,1,'2025-04-01 11:59:43'),(17,'hjbhj','jgvhj',30,0,'2025-05-05 11:30:09');
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
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklisted_tokens`
--

LOCK TABLES `blacklisted_tokens` WRITE;
/*!40000 ALTER TABLE `blacklisted_tokens` DISABLE KEYS */;
INSERT INTO `blacklisted_tokens` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiYWJjZGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Mzk4NjczLCJleHAiOjE3MzY0MTY2NzN9.pTdq79jKaRTw2s729jruTzQo-0ZOXAQTw9viFF6VZf0','2025-01-09 05:51:19','2025-01-09 15:27:53'),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjMxNzQsImV4cCI6MTczNzA0MTE3NH0.8j-1BtgoSyOR6xflOFm_AfE5oY4P-NVY9M8oNfH__98','2025-01-16 10:26:26','2025-01-16 20:56:14'),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjI2OTksImV4cCI6MTczNzA0MDY5OX0.sRdthNKcE6cf10eslPv36_TyXZLJP9-f7kFJXPAs3Uk','2025-01-16 10:28:42','2025-01-16 20:48:19'),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MDEsImV4cCI6MTczNzA0MTQwMX0.gnKR_dPrdmtQTaMGcnLhut0irKNBSKhXtO_xxiEFuHc','2025-01-16 10:30:08','2025-01-16 21:00:01'),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MTUsImV4cCI6MTczNzA0MTQxNX0.5JIAk5tKSmfDl32iUMpzY1Akl2q8lVHwx6Wg9wr13m0','2025-01-16 10:30:27','2025-01-16 21:00:15'),(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM0MzIsImV4cCI6MTczNzA0MTQzMn0.IOiJTlUsi0-LWOPHgsp27a8ol79yf3KyEGOnh8RLLGw','2025-01-16 10:33:16','2025-01-16 21:00:32'),(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjM2MDAsImV4cCI6MTczNzA0MTYwMH0.4Ew5VXkfTKaatNz_frFcwnW9hItLGSB6HcuJlGEs5kk','2025-01-16 10:39:30','2025-01-16 21:03:20'),(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwMjQwMDIsImV4cCI6MTczNzA0MjAwMn0.fMjtd03c0CMmB28Hqinm0Vx2e6RRutUmIlw4zpph-wA','2025-01-16 10:43:24','2025-01-16 21:10:02'),(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwODgzMTksImV4cCI6MTczNzEwNjMxOX0.58dqQFjhbbyM-K7dcO86kXYANtlo7BSNPm-TERZVEWM','2025-01-17 04:33:33','2025-01-17 15:01:59'),(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcwODg0MTgsImV4cCI6MTczNzEwNjQxOH0.Oxu-geHL-iCcfjGrPpSB3Wr2_ECDyS2e_PoDxvidlcM','2025-01-17 08:18:37','2025-01-17 15:03:38'),(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzcxMDE5MjMsImV4cCI6MTczNzExOTkyM30.llaUosEm7dQB4_labdbqeftNeFVsmIryPoipc3d5bek','2025-01-17 11:53:15','2025-01-17 18:48:43'),(12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3MzczNDcxNTMsImV4cCI6MTczNzM2NTE1M30.J939c_hx37EIkt4LnWQUookOQ6zrEPuGxahI4OGs6eY','2025-01-20 07:43:24','2025-01-20 14:55:53'),(13,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc0NTY0OTYsImV4cCI6MTczNzQ3NDQ5Nn0.pi7DA2CdfLwrSLP0LUojJ7PW1_A7ZLH8YEWxF9sVUhc','2025-01-21 10:56:34','2025-01-21 21:18:16'),(14,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc0NTcwMDIsImV4cCI6MTczNzQ3NTAwMn0._Or7cCK-ooYlDduE96w-GGxHiTndnBpv-bNXu6_-0SQ','2025-01-21 10:56:46','2025-01-21 21:26:42'),(15,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1MTk3MzMsImV4cCI6MTczNzUzNzczM30.dEG4kVAfp3L6sy2LLcVmQDd9n_rZqAv6KRZRau0Cr84','2025-01-22 06:03:59','2025-01-22 14:52:13'),(16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1Mjg3OTUsImV4cCI6MTczNzU0Njc5NX0.7pWOllOHgcQC_MyzaEucyP1Qlq7RbsJ_1a0m7qz3zpk','2025-01-22 06:53:56','2025-01-22 17:23:15'),(17,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzc1MzAyMjQsImV4cCI6MTczNzU0ODIyNH0.kyPYrwUUTCH7QNRrsvgBn5LO2V131201hYzSD9EOJs4','2025-01-22 07:38:51','2025-01-22 17:47:04'),(18,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NTgzMzYsImV4cCI6MTczODY3NjMzNn0.NBM8oNDXbxPPmv_E58F55RY2fZHcauaXiSHnneH2Cw0','2025-02-04 08:41:02','2025-02-04 19:08:56'),(19,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NTg1NzAsImV4cCI6MTczODY3NjU3MH0.k1vZqK_to8Hgl5tV0awE_xWxxEIskePpLJRLZFiQejw','2025-02-04 08:53:22','2025-02-04 19:12:50'),(20,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjAyMDIsImV4cCI6MTczODY3ODIwMn0.yEm7N0OlxXmaK-6Guf2c82ceE41V-jaWw5rz6n-zSwE','2025-02-04 09:10:09','2025-02-04 19:40:02'),(21,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjQ5NDUsImV4cCI6MTczODY4Mjk0NX0.GMtHeDj70uS4rzBZ0NBr7bHl84Y2JuuiPb-mmF9dkc4','2025-02-04 10:29:14','2025-02-04 20:59:05'),(22,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjUwMTYsImV4cCI6MTczODY4MzAxNn0.KvszSzbNnaMINJKan6GzpGWN0u9TLnxJ9Xi1v5SDMvU','2025-02-04 10:30:36','2025-02-04 21:00:16'),(23,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NjUwMzksImV4cCI6MTczODY4MzAzOX0.JzqtACG8QeVAB1xn2hHVJBDKffAaGohRsgEKRsJcjRM','2025-02-04 12:14:58','2025-02-04 21:00:39'),(24,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzg2NzEzMDIsImV4cCI6MTczODY4OTMwMn0.eZel-BcQf7CIjfH3tsnma997OfkgYZDa5TVoAQuqZgw','2025-02-04 12:32:04','2025-02-04 22:45:02'),(25,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk0MjA5MTYsImV4cCI6MTczOTQzODkxNn0.ZCRmGQDaJthpa1yGg-aAvylaP2VX_NSrrHSLcj0CNrA','2025-02-13 04:39:11','2025-02-13 14:58:36'),(26,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTQyNDcsImV4cCI6MTczOTUzMjI0N30.jvdRSL2LcL2XT4INrkCyTO8k3EInz5Oej2dlehMRwJ0','2025-02-14 06:24:40','2025-02-14 16:54:07'),(27,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTU4NjAsImV4cCI6MTczOTUzMzg2MH0.aSx0elOWsSKaQUjShQ-pcn936kfgvheZS0bNqzrCyzE','2025-02-14 07:40:19','2025-02-14 17:21:00'),(28,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MTg4MjMsImV4cCI6MTczOTUzNjgyM30.cr3AjRETNVq9szysdpR2rUaOuunbPIOnOJ_-dvl5nyM','2025-02-14 07:47:18','2025-02-14 18:10:23'),(29,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MjM1MjUsImV4cCI6MTczOTU0MTUyNX0.us8tOCqjFU1qAkDJK78_ThZV-lUSmZqfcdrCXEaWH30','2025-02-14 08:58:56','2025-02-14 19:28:45'),(30,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk1MjM1NDMsImV4cCI6MTczOTU0MTU0M30.rTwORa33o1iru4ANugqVM3_MzDNLZNndcomJqtW6SIY','2025-02-14 12:07:32','2025-02-14 19:29:03'),(31,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk3NjY5OTgsImV4cCI6MTczOTc4NDk5OH0.RyiEJmxZyYcWr5FA-RANEyVhslllLrL2yrFMLuoFUQ0','2025-02-17 08:13:38','2025-02-17 15:06:38'),(32,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk3ODAwMjMsImV4cCI6MTczOTc5ODAyM30.5zKbk35RG6reAbUUHMgF3bI0ZolxjljpuzFQye2IQ7U','2025-02-17 10:40:39','2025-02-17 18:43:43'),(33,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3Mzk4NTUzMjMsImV4cCI6MTczOTg3MzMyM30.1kg4dXfhdm0yr9R-xGbbWzKdQdFZ5HA4tylP6TvaWaE','2025-02-18 05:14:28','2025-02-18 15:38:43'),(34,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDA1NDUwODcsImV4cCI6MTc0MDU2MzA4N30.EuSgm7QLX-7wZ-Z8zWrXTnDY2KkXJITDxZgwsw9rqig','2025-02-26 08:32:30','2025-02-26 15:14:47'),(35,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDA3MTY2ODcsImV4cCI6MTc0MDczNDY4N30.YPrUN_sH1afUNs_4QjqMAGn2VsH0_9bWaW5kp1VFT94','2025-02-28 05:48:58','2025-02-28 14:54:47'),(36,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNjAyNDcsImV4cCI6MTc0MTA3ODI0N30.ZpA3RA3PSr2Yoe9zXLuO4WOR6Djfwc4PsUtbTkfsb8Y','2025-03-04 05:17:40','2025-03-04 14:20:47'),(37,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNjU0NjYsImV4cCI6MTc0MTA4MzQ2Nn0._03iQ7lmJUf-GoU17YGZGjfgMCjTzEeai9O98BRQEAU','2025-03-04 05:18:09','2025-03-04 15:47:46'),(38,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwNzQ1NTcsImV4cCI6MTc0MTA5MjU1N30.mK6TzAh7DsFxxPMTlZ9wb6pbqw6ldTD25_Oz8b4zg6Y','2025-03-04 08:00:04','2025-03-04 18:19:17'),(39,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJpYXQiOjE3NDEwODMyODgsImV4cCI6MTc0MTEwMTI4OH0.2Pd4ptbocPwJLhWGf-Hgq1uaNZZnsG2VFNWvfHA5W0E','2025-03-04 10:15:05','2025-03-04 20:44:48'),(40,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc0MjE4OTc3MywiZXhwIjoxNzQyMjA3NzczfQ.z5S30-pl32imhlCI2AbFfkJpnC8vM-z5EHntMWrpWro','2025-03-17 07:07:10','2025-03-17 16:06:13'),(41,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjE5NTIzNywiZXhwIjoxNzQyMjEzMjM3fQ.p50STa1BOnw24kRiEdbM8RfZsWAMGgKT4NpUoU4HMl0','2025-03-17 10:50:12','2025-03-17 17:37:17'),(42,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjIwODYxNSwiZXhwIjoxNzQyMjI2NjE1fQ.GKxbq3GOZ2JQqE2VtWMiN5g_Lzwnsuuh7XIN9HYV9a8','2025-03-17 10:54:51','2025-03-17 21:20:15'),(43,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBnbWFpbC5pbiIsImlhdCI6MTc0MjI5NTIzMCwiZXhwIjoxNzQyMzEzMjMwfQ.IKh4LLAH6Y9cF2By2y02y7PN7LtlYz2liJVH0OOLhms','2025-03-18 10:55:18','2025-03-18 21:23:50'),(44,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc0MjQ1MDMwMiwiZXhwIjoxNzQyNDY4MzAyfQ.XnoEM74nlVnL05V60z4GRhfoBgdMcBCjgWJ-xoxAbZ0','2025-03-20 07:31:49','2025-03-20 16:28:22'),(45,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDM0ODE3OTAsImV4cCI6MTc0MzQ5OTc5MH0.cAnVYj6ciyNZTT_pknTlwvGllKHpswq3GjcXchnMnMY','2025-04-01 06:24:05','2025-04-01 14:59:50'),(46,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQwOTUyMjksImV4cCI6MTc0NDExMzIyOX0.tUSAJn2bEstJeYDP2KMIeTYOYEOKszBqmsVCLD-ZxuI','2025-04-08 08:30:33','2025-04-08 17:23:49'),(47,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ3Nzc3NjAsImV4cCI6MTc0NDc5NTc2MH0.aZdqWoE7qRkgIMCGw6TWj03S47XiVjs6-m9Fi1TBmXQ','2025-04-16 06:17:05','2025-04-16 14:59:20'),(48,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDQ3OTczMjYsImV4cCI6MTc0NDgxNTMyNn0.eczLIXQKJymriRB-GzpcZF0ikuvZgDOxekrHo_AjmIc','2025-04-16 10:25:20','2025-04-16 20:25:26'),(49,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ3OTkxMjYsImV4cCI6MTc0NDgxNzEyNn0.CPB0KdNl1dXLuzu3S1cvxuRSpbIdP24ackb4-ZSVA4E','2025-04-16 10:49:00','2025-04-16 20:55:26'),(50,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDQ4NzM3NjYsImV4cCI6MTc0NDg5MTc2Nn0.ERk-VfFEccCjXpIxgEAQSts-ETLCDbpUhb0lq5lqTeQ','2025-04-17 07:27:53','2025-04-17 17:39:26'),(51,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDQ5NTkxODIsImV4cCI6MTc0NDk3NzE4Mn0.9nz3ScNwoXyB34Ctp30E2FmIp94ymaZ2Uwuh8s-pBR4','2025-04-18 07:10:52','2025-04-18 17:23:02'),(52,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyMzA5MywiZXhwIjoxNzQ1MjQxMDkzfQ.l-PLPFzc3lM2q8t0b5GMc8ca8Vnt1oiHOIgsmCENGns','2025-04-21 08:11:58','2025-04-21 18:41:33'),(53,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNDQwMSwiZXhwIjoxNzQ1MjQyNDAxfQ.QpQ0Bo7WsnjXkCHrQPsiiRYQsrekskHRYHLuG5Lc3y8','2025-04-21 08:35:42','2025-04-21 19:03:21'),(54,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNDU1NywiZXhwIjoxNzQ1MjQyNTU3fQ.WZEZc9eJIozwdLaHCwrWLSGPs9z2UwSsPL6EjI7z1-8','2025-04-21 08:48:12','2025-04-21 19:05:57'),(55,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTMwOSwiZXhwIjoxNzQ1MjQzMzA5fQ.SheXRFWw-YDVF-YJt2pjSKn62GsCOx7tXkrwPp60A3A','2025-04-21 08:50:55','2025-04-21 19:18:29'),(56,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTQ2OSwiZXhwIjoxNzQ1MjQzNDY5fQ.WdRgJVCF1b5rl4Ptx_lP2fRfGFUOUlkT5276P0cMUAw','2025-04-21 08:53:40','2025-04-21 19:21:09'),(57,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIyNTYzMSwiZXhwIjoxNzQ1MjQzNjMxfQ.VYnl-Rg6odJfcnoJS-GB6_VYz_hMcOtoGXl0nTUfg1U','2025-04-21 11:04:27','2025-04-21 19:23:51'),(58,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTIzMzYyMSwiZXhwIjoxNzQ1MjUxNjIxfQ.CIHzKpdZpNitNPtdAGo20VLoubC3cqZbGmt8H2AHQro','2025-04-21 13:14:11','2025-04-21 16:07:01'),(59,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MTM2MiwiZXhwIjoxNzQ1MjU5MzYyfQ.58CRJWmyDSNLNwuuqHXrbcq9ipb8LEemZnwTnvYUEUo','2025-04-21 13:51:50','2025-04-21 23:46:02'),(60,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzUyMywiZXhwIjoxNzQ1MjYxNTIzfQ.USpFQV-sTrnLnBE2roDYI7I2gH29qD0x9eRgZYhwC6w','2025-04-21 13:52:25','2025-04-22 00:22:03'),(61,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzU1NCwiZXhwIjoxNzQ1MjYxNTU0fQ.QWk0m5YHNIJx5sFS3TrdVx4Op_zr7Xsx_Yoxz3Kkb_c','2025-04-21 13:53:44','2025-04-22 00:22:34'),(62,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoiZnJ1aXR3YWxhQG9yZy5pbiIsInJvbGVfaWQiOjIsImlhdCI6MTc0NTI0MzYzMiwiZXhwIjoxNzQ1MjYxNjMyfQ.zQd9QN8aqTTJMm2mlbnTumSRVNdpbAO_uurW3m7IXlQ','2025-04-21 13:56:02','2025-04-22 00:23:52'),(63,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1Mjk2OTY4LCJleHAiOjE3NDUzMTQ5Njh9.8PDZ5QIRgGrxKal-WQNR7595ciu7eZKo5xGEL_vpj2A','2025-04-22 07:18:56','2025-04-22 15:12:48'),(64,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzA2NzkzLCJleHAiOjE3NDUzMjQ3OTN9.lDDdLKMJ1B4gWR8FubHfEnz6cjEy80MXCn3_3aeLuCU','2025-04-22 09:49:33','2025-04-22 17:56:33'),(65,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE2MDE3LCJleHAiOjE3NDUzMzQwMTd9.FOL4KznHSCCuDgjOZvbslbuOH6Tyb1am8Xm06o8a-8Y','2025-04-22 10:17:54','2025-04-22 15:00:17'),(66,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDUzMTczOTQsImV4cCI6MTc0NTMzNTM5NH0.TgrdBmb-nc_el01qGPtrOSo1dqARIzw8vtTBzZmwWFE','2025-04-22 10:23:18','2025-04-22 20:53:14'),(67,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE3NDE5LCJleHAiOjE3NDUzMzU0MTl9.b34BTA3-ndJAtJNEjo07TIzT73oeqCI6eTMjmvaR1vA','2025-04-22 10:42:10','2025-04-22 20:53:39'),(68,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE4NTQ3LCJleHAiOjE3NDUzMzY1NDd9.rto8fhdyNdq63BlDgGHgj0bBlcu5sHR1soDdkt9G6Zo','2025-04-22 10:58:17','2025-04-22 21:12:27'),(69,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE5NTExLCJleHAiOjE3NDUzMzc1MTF9.CGu1xovSaYe1FUZ0MiwAqzscwpGJGlhhllQPECle-QA','2025-04-22 10:59:09','2025-04-22 21:28:31'),(70,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzE5NTY1LCJleHAiOjE3NDUzMzc1NjV9.d3_fF8jKKYWSm_Y34e6IryHryDIPfNPx7SAeeev8X4Q','2025-04-22 11:01:49','2025-04-22 21:29:25'),(71,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzE5NzI4LCJleHAiOjE3NDUzMzc3Mjh9.5qg3aoc4F8891fQ-YCSHFN1_7C-CFc9LPIiWrVgb-fg','2025-04-22 11:08:01','2025-04-22 21:32:08'),(72,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwMTAxLCJleHAiOjE3NDUzMzgxMDF9.4bVk3AGkG_uKJiVFv9HhsG1qrjyBWcNLFDrOkSm6FAQ','2025-04-22 11:08:35','2025-04-22 21:38:21'),(73,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwMTU1LCJleHAiOjE3NDUzMzgxNTV9.MDLDlQ2ovDBhytFiL3-VrV9LzEAGzKU_CizcNoFmWeI','2025-04-22 11:20:39','2025-04-22 21:39:15'),(74,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ1MzIwODUzLCJleHAiOjE3NDUzMzg4NTN9.fJHNYwxAoOZyw0R53dRbhd_KpXuf0LOr8FXZv1CA4rI','2025-04-22 11:21:12','2025-04-22 21:50:53'),(75,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzA0MTc0LCJleHAiOjE3NDUzMjIxNzR9.IihCaQUZazXjtIbucTYaJiOqm93-ver6G3m6niCJWH8','2025-04-22 11:35:52','2025-04-22 11:42:54'),(76,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1MzIwODk0LCJleHAiOjE3NDUzMzg4OTR9.WmConU0zb9rUE5RxhQ4iSsmN3yas0jVxT4UTQOmqjtE','2025-04-22 11:59:28','2025-04-22 21:51:34'),(77,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDE0ODQ3LCJleHAiOjE3NDU0MzI4NDd9.AV1ko4hUqzoXCcxyQijj1XHFhBofDmcpUKAl0zbiFFs','2025-04-23 13:34:23','2025-04-23 23:57:27'),(78,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDY5MTYxLCJleHAiOjE3NDU0ODcxNjF9.-HZXO2VPYakiEaLyZSWN-HgPdmzQJ3E_I7HM4TLEyXs','2025-04-24 05:28:17','2025-04-24 09:32:41'),(79,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyNzkyLCJleHAiOjE3NDU0OTA3OTJ9.0ogNJ28J4PaZhkY6H2S0ieqgl4g6QQNn3uE1K7I16g0','2025-04-24 05:34:04','2025-04-24 10:33:12'),(80,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyNjY2LCJleHAiOjE3NDU0OTA2NjZ9.uzPIm7k04FTuNfaHjiPH5GfrwUuEAbn5sbKuu3dGqg0','2025-04-24 05:34:44','2025-04-24 10:31:06'),(81,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NDcyODczLCJleHAiOjE3NDU0OTA4NzN9.uTJsit94qKifCzQsa-qntqee33xaZ3Qr7PeOFobuhzg','2025-04-24 05:35:03','2025-04-24 10:34:33'),(82,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzMjI1LCJleHAiOjE3NDU2MDEyMjV9.gPIctmrQsWgzcVTaK093VWOTgjtxpUWndqAgFCwzjqU','2025-04-25 12:22:34','2025-04-25 22:43:45'),(83,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM3NjAsImV4cCI6MTc0NTYwMTc2MH0.JcClCBBDzOhRnnaBP7qDLdX-_rRDR2VuDtlSwKMyw5g','2025-04-25 12:23:07','2025-04-25 22:52:40'),(84,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM3OTksImV4cCI6MTc0NTYwMTc5OX0.xVHKPYgprc-j5kZCLnFv8xHuf24o-kzckMkv0cVXdCU','2025-04-25 12:23:33','2025-04-25 22:53:19'),(85,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJyb2xlX2lkIjozLCJpYXQiOjE3NDU1ODM4NzcsImV4cCI6MTc0NTYwMTg3N30.ZcERyoSMM4lruHqSw91XiiR0PfSY3yy3xQOdj4v2BY0','2025-04-25 12:24:51','2025-04-25 22:54:37'),(86,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzODk1LCJleHAiOjE3NDU2MDE4OTV9.ieB6M9rYysd3qmqTOPLUgnaECFMKqnbOYEPZ80Csn4A','2025-04-25 12:26:14','2025-04-25 17:24:55'),(87,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTgzOTc5LCJleHAiOjE3NDU2MDE5Nzl9.VKR_5aOY-CqE7PUSNv173cHzLvwMacwDMraOXvXNjZE','2025-04-25 12:28:53','2025-04-25 17:26:19'),(88,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg0MTcyLCJleHAiOjE3NDU2MDIxNzJ9.gZX9rYDmS4Xz5Gz_2-FAW56y6ZusY1TxLK6eUW4KeWM','2025-04-25 12:31:03','2025-04-25 17:29:32'),(89,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6InRlc3RAZ21haWwuaW4iLCJyb2xlX2lkIjoyLCJpYXQiOjE3NDU1ODQyNzEsImV4cCI6MTc0NTYwMjI3MX0.yk7gdXwEl5sM7SIY9dYdnmM6JRdK_t7eAqYld-dnppc','2025-04-25 12:32:02','2025-04-25 17:31:11'),(90,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg2MDk1LCJleHAiOjE3NDU2MDQwOTV9.eKS2EtRkxjVcSFn2j1Ybx8Mv30BsZ09VBV-CMffTpd0','2025-04-25 13:02:26','2025-04-25 23:31:35'),(91,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1NTg2MTUwLCJleHAiOjE3NDU2MDQxNTB9.LGmrLOi9jehMu7NLdywuRSU4nKiwdZuG6EEzhjTE9lw','2025-04-25 13:05:15','2025-04-25 23:32:30'),(92,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ1OTA5MTE1LCJleHAiOjE3NDU5MjcxMTV9.gmdu0L4ogSQXiVl7_cvW_4qCPvFOahbpUOdZrlGLtX8','2025-04-29 06:58:39','2025-04-29 11:45:15'),(93,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2MTYzMDk0LCJleHAiOjE3NDYxODEwOTR9.ZwkUzQXj7C2WgOzAaoXoNHZ-FTjryD3XbJK1E5rySz4','2025-05-02 05:18:25','2025-05-02 10:18:14'),(94,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2NDIzMzczLCJleHAiOjE3NDY0NDEzNzN9.9Hp0XgJtg2OAYpspDH61G98aRQ7adapcv7zaoREBnbk','2025-05-05 05:40:37','2025-05-05 16:06:13'),(95,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksImVtYWlsIjoibmV1cmVAZ21haWwuY29tIiwicm9sZV9pZCI6MiwiaWF0IjoxNzQ2NDI2MzUxLCJleHAiOjE3NDY0NDQzNTF9.hrJ7f_nroKnW23qOK3wuBoO7OKYrJoujHw76d3eTUgw','2025-05-05 07:37:43','2025-05-05 11:25:51'),(96,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsImVtYWlsIjoicmlja3lAZ21haWwuY29tIiwicm9sZV9pZCI6MywiaWF0IjoxNzQ2NTA1NzE3LCJleHAiOjE3NDY1MjM3MTd9.jvAfaZ4qtwyGuVIL8nyuiWI2DF4rONPDVP-vTkpGBlA','2025-05-06 09:13:51','2025-05-06 09:28:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'Tata Housing Private Limited','2023-12-25 02:30:00',20,4528,0,'tech','[\"Well-being metrics & analytics\", \"Workshops & Webinars\"]','fcvghbjknm',NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/images/profiles/companies/Jh6bRYx04PfPl-GOEiMs4.jpg',1,'2025-01-21 08:58:59','2025-05-01 18:30:04',1,100,25),(2,'HealthifyMe','2023-12-15 14:45:00',NULL,250,0,'Chip Manufacturing',NULL,NULL,NULL,NULL,0,'2025-01-21 08:58:59','2025-04-30 18:31:03',1,NULL,0),(3,'Bitroot','2023-11-10 09:20:00',NULL,1000,0,'Software Technology',NULL,NULL,NULL,NULL,0,'2025-01-21 08:58:59','2025-04-30 18:31:04',1,NULL,0),(4,'AgroGrow','2023-10-05 17:00:00',NULL,250,0,'Cloth Manufacturing',NULL,NULL,NULL,NULL,0,'2025-01-21 08:58:59','2025-04-30 18:31:05',1,NULL,NULL),(5,'FinEdge','2023-09-25 08:10:00',NULL,600,0,'Car Manufacturer',NULL,NULL,NULL,NULL,0,'2025-01-21 08:58:59','2025-04-30 18:31:05',1,NULL,NULL),(6,'Tech Solutions','2025-03-21 10:48:22',NULL,100,0,NULL,NULL,NULL,NULL,NULL,0,'2025-03-21 10:48:22','2025-04-30 18:31:06',1,NULL,0),(23,'TheFruit','2025-04-19 04:56:29',NULL,10,0,NULL,NULL,NULL,109,NULL,1,'2025-04-21 06:26:29','2025-05-06 18:30:04',1,40,49),(24,'Neure','2025-04-22 05:40:51',NULL,60,0,NULL,NULL,NULL,111,NULL,1,'2025-04-22 05:40:51','2025-04-30 18:31:07',1,NULL,0),(25,'Technova','2025-05-05 10:03:44',NULL,100,NULL,NULL,NULL,NULL,125,NULL,1,'2025-05-05 10:03:44','2025-05-05 18:30:05',1,NULL,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_deactivation_requests`
--

LOCK TABLES `company_deactivation_requests` WRITE;
/*!40000 ALTER TABLE `company_deactivation_requests` DISABLE KEYS */;
INSERT INTO `company_deactivation_requests` VALUES (7,23,'No longer required','nothing','approved','2025-04-21 10:47:57','2025-04-21 10:52:21');
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
INSERT INTO `company_departments` VALUES (1,1,'2025-01-10 09:00:00'),(1,2,'2025-01-10 09:15:00'),(1,3,'2025-01-10 09:30:00'),(1,4,'2025-01-10 09:45:00'),(1,5,'2025-01-10 10:00:00'),(1,6,'2025-01-10 10:15:00'),(1,7,'2025-01-10 10:30:00'),(1,8,'2025-01-10 10:45:00'),(1,9,'2025-01-10 11:00:00'),(1,10,'2025-01-10 11:15:00'),(2,1,'2025-01-10 09:00:00'),(2,2,'2025-01-10 09:15:00'),(2,3,'2025-01-10 09:30:00'),(2,4,'2025-01-10 09:45:00'),(2,5,'2025-01-10 10:00:00'),(2,6,'2025-01-10 10:15:00'),(2,7,'2025-01-10 10:30:00'),(2,8,'2025-01-10 10:45:00'),(2,9,'2025-01-10 11:00:00'),(2,10,'2025-01-10 11:15:00'),(6,1,'2025-03-21 10:48:22'),(6,4,'2025-03-21 10:48:22'),(6,7,'2025-03-21 10:48:22'),(23,10,'2025-04-21 06:26:30'),(24,1,'2025-04-22 05:40:51'),(25,10,'2025-05-05 10:03:44');
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
INSERT INTO `company_employees` VALUES (1,2,'2025-03-05 08:14:01',1,25,100,1,0,1,0,NULL,'hello','2025-05-07 06:36:05','',1),(6,103,'2025-04-18 10:22:01',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(6,104,'2025-04-18 10:22:01',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(6,105,'2025-04-18 10:22:02',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(6,106,'2025-04-18 10:22:02',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(6,107,'2025-04-18 10:22:02',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(23,109,'2025-04-21 06:26:30',1,38,50,NULL,0,1,0,NULL,'hello','2025-05-07 06:36:05','',1),(23,110,'2025-04-21 06:28:48',1,60,29,NULL,40,1,0,NULL,'Good','2025-05-07 06:36:05','',8),(24,111,'2025-04-22 05:40:51',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0),(25,125,'2025-05-05 10:03:44',1,0,NULL,NULL,0,0,0,NULL,NULL,'2025-05-07 06:36:05','',0);
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
INSERT INTO `company_gallery_assignments` VALUES (11,1,4,'document','2025-03-27 11:27:52','2025-04-04 08:34:02'),(19,1,9,'image','2025-04-14 12:01:38','2025-04-14 12:01:38'),(20,1,10,'image','2025-04-14 12:02:12','2025-04-14 12:02:12'),(21,2,22,'video','2025-04-14 12:02:38','2025-04-14 12:02:38'),(22,2,24,'video','2025-04-14 12:02:58','2025-04-14 12:02:58');
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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_metrics_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_metrics_history`
--

LOCK TABLES `company_metrics_history` WRITE;
/*!40000 ALTER TABLE `company_metrics_history` DISABLE KEYS */;
INSERT INTO `company_metrics_history` VALUES (1,1,'2025-04-01',60,88.7143,48.0333,50.7143,'2025-04-16 04:53:31'),(2,2,'2025-04-01',NULL,NULL,0,NULL,'2025-04-16 04:53:31'),(3,5,'2025-04-01',NULL,NULL,NULL,NULL,'2025-04-16 04:53:31'),(8,1,'2025-04-01',54,85.7143,28.0333,70.7143,'2025-04-16 04:57:26'),(9,2,'2025-04-01',NULL,NULL,0,NULL,'2025-04-16 04:57:27'),(10,5,'2025-04-01',NULL,NULL,NULL,NULL,'2025-04-16 04:57:27'),(15,1,'2024-05-01',10,0.75,0.68,0.72,'2025-04-16 05:52:01'),(16,1,'2024-06-01',12,0.76,0.7,0.74,'2025-04-16 05:52:01'),(17,1,'2024-07-01',58,0.78,0.72,0.75,'2025-04-16 05:52:01'),(18,1,'2024-08-01',99,0.8,0.74,0.76,'2025-04-16 05:52:01'),(19,1,'2024-09-01',43,0.82,0.76,0.78,'2025-04-16 05:52:01'),(20,1,'2024-10-01',53,0.84,0.78,0.8,'2025-04-16 05:52:01'),(21,1,'2024-11-01',0,0.85,0.79,0.81,'2025-04-16 05:52:01'),(22,1,'2024-12-01',50,0.86,0.8,0.82,'2025-04-16 05:52:01'),(23,1,'2025-01-01',62,0.87,0.82,0.83,'2025-04-16 05:52:01'),(24,1,'2025-02-01',48,0.88,0.83,0.84,'2025-04-16 05:52:01'),(25,1,'2025-03-01',47,0.89,0.85,0.85,'2025-04-16 05:52:01'),(26,1,'2025-04-01',23,0.9,0.86,0.86,'2025-04-16 05:52:01'),(27,1,'2025-04-01',100,66.6667,35,20,'2025-04-30 18:31:00'),(28,2,'2025-04-01',NULL,0,0,NULL,'2025-04-30 18:31:01'),(29,3,'2025-04-01',NULL,0,0,NULL,'2025-04-30 18:31:01'),(30,4,'2025-04-01',NULL,NULL,NULL,NULL,'2025-04-30 18:31:01'),(31,5,'2025-04-01',NULL,NULL,NULL,NULL,'2025-04-30 18:31:01'),(32,6,'2025-04-01',NULL,0,0,NULL,'2025-04-30 18:31:01'),(33,23,'2025-04-01',50,NULL,50.5,NULL,'2025-04-30 18:31:02'),(34,24,'2025-04-01',NULL,NULL,0,NULL,'2025-04-30 18:31:02');
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
INSERT INTO `company_retention_history` VALUES (1,1,'2025-01-01','2025-01-31',100,110,20,0,90,'2025-04-14 10:50:32'),(2,1,'2025-02-01','2025-02-28',110,120,15,0,95.4545,'2025-04-14 10:50:32'),(3,1,'2025-03-01','2025-03-31',120,125,10,0,95.8333,'2025-04-14 10:50:32'),(4,1,'2025-03-01','2025-03-31',0,1,1,0,0,'2025-04-30 18:31:01'),(5,2,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:03'),(6,3,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:04'),(7,4,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:04'),(8,5,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:05'),(9,6,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:06'),(10,23,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:06'),(11,24,'2025-03-01','2025-03-31',0,0,0,0,0,'2025-04-30 18:31:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_rewards`
--

LOCK TABLES `company_rewards` WRITE;
/*!40000 ALTER TABLE `company_rewards` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_subscriptions`
--

LOCK TABLES `company_subscriptions` WRITE;
/*!40000 ALTER TABLE `company_subscriptions` DISABLE KEYS */;
INSERT INTO `company_subscriptions` VALUES (1,1,0,0,1,1,'yearly','2025-02-28','2025-02-27 08:31:53','2025-04-15 10:52:21'),(2,23,0,0,1,1,'monthly','2025-02-28','2025-04-21 10:34:35','2025-04-24 05:31:25'),(3,24,1,1,1,1,'monthly','2025-05-22','2025-04-22 05:40:51','2025-04-22 05:40:51'),(4,25,1,1,1,1,'monthly','2025-06-05','2025-05-05 10:03:44','2025-05-05 10:03:44');
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
  KEY `company_id` (`company_id`),
  KEY `employee_daily_history_ibfk_1` (`user_id`),
  CONSTRAINT `employee_daily_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `employee_daily_history_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=538 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_daily_history`
--

LOCK TABLES `employee_daily_history` WRITE;
/*!40000 ALTER TABLE `employee_daily_history` DISABLE KEYS */;
INSERT INTO `employee_daily_history` VALUES (371,2,1,50.00,85.00,1,'2025-04-18','2025-04-18 18:30:00'),(374,103,6,0.00,0.00,1,'2025-04-18','2025-04-18 18:30:00'),(375,104,6,0.00,0.00,1,'2025-04-18','2025-04-18 18:30:00'),(376,105,6,0.00,0.00,1,'2025-04-18','2025-04-18 18:30:00'),(377,106,6,0.00,0.00,1,'2025-04-18','2025-04-18 18:30:00'),(378,107,6,0.00,0.00,1,'2025-04-18','2025-04-18 18:30:00'),(379,2,1,50.00,85.00,1,'2025-04-19','2025-04-19 18:30:01'),(382,103,6,0.00,0.00,1,'2025-04-19','2025-04-19 18:30:01'),(383,104,6,0.00,0.00,1,'2025-04-19','2025-04-19 18:30:01'),(384,105,6,0.00,0.00,1,'2025-04-19','2025-04-19 18:30:01'),(385,106,6,0.00,0.00,1,'2025-04-19','2025-04-19 18:30:01'),(386,107,6,0.00,0.00,1,'2025-04-19','2025-04-19 18:30:01'),(387,2,1,50.00,85.00,1,'2025-04-20','2025-04-20 18:30:01'),(390,103,6,0.00,0.00,1,'2025-04-20','2025-04-20 18:30:01'),(391,104,6,0.00,0.00,1,'2025-04-20','2025-04-20 18:30:01'),(392,105,6,0.00,0.00,1,'2025-04-20','2025-04-20 18:30:01'),(393,106,6,0.00,0.00,1,'2025-04-20','2025-04-20 18:30:01'),(394,107,6,0.00,0.00,1,'2025-04-20','2025-04-20 18:30:01'),(395,2,1,100.00,85.00,1,'2025-04-21','2025-04-21 18:30:00'),(398,103,6,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(399,104,6,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(400,105,6,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(401,106,6,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(402,107,6,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(403,109,23,0.00,0.00,1,'2025-04-21','2025-04-21 18:30:00'),(404,110,23,50.00,50.00,1,'2025-04-21','2025-04-21 18:30:00'),(405,2,1,100.00,85.00,1,'2025-04-22','2025-04-22 18:30:01'),(408,103,6,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(409,104,6,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(410,105,6,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(411,106,6,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(412,107,6,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(413,109,23,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(414,110,23,50.00,50.00,1,'2025-04-22','2025-04-22 18:30:01'),(415,111,24,0.00,0.00,1,'2025-04-22','2025-04-22 18:30:01'),(416,2,1,100.00,73.00,1,'2025-04-23','2025-04-23 18:30:01'),(419,103,6,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(420,104,6,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(421,105,6,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(422,106,6,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(423,107,6,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(424,109,23,50.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(425,110,23,50.00,50.00,1,'2025-04-23','2025-04-23 18:30:01'),(426,111,24,0.00,0.00,1,'2025-04-23','2025-04-23 18:30:01'),(427,2,1,100.00,73.00,1,'2025-04-26','2025-04-26 18:30:01'),(430,103,6,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(431,104,6,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(432,105,6,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(433,106,6,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(434,107,6,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(435,109,23,50.00,25.00,1,'2025-04-26','2025-04-26 18:30:01'),(436,110,23,50.00,50.00,1,'2025-04-26','2025-04-26 18:30:01'),(437,111,24,0.00,0.00,1,'2025-04-26','2025-04-26 18:30:01'),(438,2,1,100.00,73.00,1,'2025-04-27','2025-04-27 18:30:01'),(441,103,6,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(442,104,6,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(443,105,6,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(444,106,6,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(445,107,6,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(446,109,23,50.00,25.00,1,'2025-04-27','2025-04-27 18:30:01'),(447,110,23,50.00,50.00,1,'2025-04-27','2025-04-27 18:30:01'),(448,111,24,0.00,0.00,1,'2025-04-27','2025-04-27 18:30:01'),(449,2,1,100.00,73.00,1,'2025-04-28','2025-04-28 18:30:01'),(453,103,6,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(454,104,6,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(455,105,6,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(456,106,6,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(457,107,6,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(458,109,23,50.00,25.00,1,'2025-04-28','2025-04-28 18:30:01'),(459,110,23,50.00,50.00,1,'2025-04-28','2025-04-28 18:30:01'),(460,111,24,0.00,0.00,1,'2025-04-28','2025-04-28 18:30:01'),(461,2,1,100.00,73.00,1,'2025-04-29','2025-04-29 18:30:00'),(465,103,6,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(466,104,6,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(467,105,6,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(468,106,6,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(469,107,6,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(470,109,23,50.00,25.00,1,'2025-04-29','2025-04-29 18:30:00'),(471,110,23,50.00,50.00,1,'2025-04-29','2025-04-29 18:30:00'),(472,111,24,0.00,0.00,1,'2025-04-29','2025-04-29 18:30:00'),(473,2,1,100.00,85.00,1,'2025-04-30','2025-04-30 18:30:00'),(474,103,6,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(475,104,6,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(476,105,6,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(477,106,6,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(478,107,6,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(479,109,23,50.00,25.00,1,'2025-04-30','2025-04-30 18:30:00'),(480,110,23,50.00,58.00,1,'2025-04-30','2025-04-30 18:30:00'),(481,111,24,0.00,0.00,1,'2025-04-30','2025-04-30 18:30:00'),(482,2,1,100.00,35.00,1,'2025-05-01','2025-05-01 18:30:01'),(483,103,6,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(484,104,6,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(485,105,6,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(486,106,6,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(487,107,6,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(488,109,23,50.00,38.00,1,'2025-05-01','2025-05-01 18:30:01'),(489,110,23,70.00,63.00,1,'2025-05-01','2025-05-01 18:30:01'),(490,111,24,0.00,0.00,1,'2025-05-01','2025-05-01 18:30:01'),(491,2,1,100.00,25.00,1,'2025-05-02','2025-05-02 18:30:01'),(492,103,6,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(493,104,6,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(494,105,6,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(495,106,6,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(496,107,6,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(497,109,23,50.00,38.00,1,'2025-05-02','2025-05-02 18:30:01'),(498,110,23,70.00,38.00,1,'2025-05-02','2025-05-02 18:30:01'),(499,111,24,0.00,0.00,1,'2025-05-02','2025-05-02 18:30:01'),(500,2,1,100.00,25.00,1,'2025-05-03','2025-05-03 18:30:01'),(501,103,6,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(502,104,6,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(503,105,6,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(504,106,6,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(505,107,6,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(506,109,23,50.00,38.00,1,'2025-05-03','2025-05-03 18:30:01'),(507,110,23,70.00,38.00,1,'2025-05-03','2025-05-03 18:30:01'),(508,111,24,0.00,0.00,1,'2025-05-03','2025-05-03 18:30:01'),(509,2,1,100.00,25.00,1,'2025-05-04','2025-05-04 18:30:01'),(510,103,6,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(511,104,6,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(512,105,6,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(513,106,6,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(514,107,6,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(515,109,23,50.00,38.00,1,'2025-05-04','2025-05-04 18:30:01'),(516,110,23,70.00,38.00,1,'2025-05-04','2025-05-04 18:30:01'),(517,111,24,0.00,0.00,1,'2025-05-04','2025-05-04 18:30:01'),(518,2,1,100.00,25.00,1,'2025-05-05','2025-05-05 18:30:01'),(519,103,6,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(520,104,6,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(521,105,6,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(522,106,6,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(523,107,6,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(524,109,23,50.00,38.00,1,'2025-05-05','2025-05-05 18:30:01'),(525,110,23,29.00,38.00,1,'2025-05-05','2025-05-05 18:30:01'),(526,111,24,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(527,125,25,0.00,0.00,1,'2025-05-05','2025-05-05 18:30:01'),(528,2,1,100.00,25.00,1,'2025-05-06','2025-05-06 18:30:00'),(529,103,6,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(530,104,6,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(531,105,6,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(532,106,6,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(533,107,6,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(534,109,23,50.00,38.00,1,'2025-05-06','2025-05-06 18:30:00'),(535,110,23,29.00,38.00,1,'2025-05-06','2025-05-06 18:30:00'),(536,111,24,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00'),(537,125,25,0.00,0.00,1,'2025-05-06','2025-05-06 18:30:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_rewards`
--

LOCK TABLES `employee_rewards` WRITE;
/*!40000 ALTER TABLE `employee_rewards` DISABLE KEYS */;
INSERT INTO `employee_rewards` VALUES (48,23,110,110,1,'2025-04-21 09:13:54',1,'2025-05-05 05:11:32'),(49,23,110,110,1,'2025-04-25 06:57:53',1,'2025-05-05 05:11:35'),(50,23,110,110,3,'2025-04-25 08:28:24',1,'2025-05-05 05:11:45'),(51,23,110,110,8,'2025-04-25 08:28:50',1,'2025-05-05 05:12:31'),(52,23,109,109,2,'2025-04-28 06:09:45',0,NULL),(53,23,110,110,7,'2025-04-29 06:10:38',1,'2025-04-30 10:58:37'),(54,23,110,110,5,'2025-04-30 12:42:18',1,'2025-04-30 12:42:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (4,1,'Neure is your personal AI companion designed to boost productivity, creativity, and mental clarity. Whether you\'re planning projects, setting goals, or organizing ideas, Neure provides smart, intuitive suggestions to keep you on track. Powered by cutting-edge AI, it adapts to your needs, offering insights, reminders, and personalized guidance. With a clean, minimalist interface and seamless integration into your workflow, Neure helps you think faster, work smarter, and stay focused. It\'s more than an app — it\'s a partner in your growth journey. Let Neure organize your mind, so you can unlock your true potential effortlessly every day.\n\n','bug','2025-03-03 06:55:43','2025-04-28 07:12:58'),(5,1,'scdvxc ','suggestion','2025-03-20 07:36:02','2025-03-20 07:36:02'),(6,23,'hello','bug','2025-04-28 06:19:42','2025-04-28 06:19:42');
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
INSERT INTO `gallery` VALUES (4,'ABCD','description',NULL,'document','https://neure-staging.s3.ap-south-1.amazonaws.com/gallery/1/document/o7Hv6upq-a2xpU92Xfbd1.pdf',319690,NULL,'2025-03-18 10:13:48','2025-03-27 10:54:26'),(9,'Sample Image','This is a sample image','[\"nature\", \"landscape\"]','image','https://cdn.pixabay.com/photo/2025/02/17/16/04/dog-9413394_1280.jpg',0,NULL,'2025-03-27 12:01:01','2025-03-27 12:01:01'),(10,'Sample Image test','This is a sample image','[\"nature\", \"landscape\"]','image','https://cdn.pixabay.com/photo/2025/02/17/16/04/dog-9413394_1280.jpg',0,NULL,'2025-03-27 12:01:34','2025-03-27 12:14:38'),(22,'Gallery test','fcghvbjknmlFcghvbjknml ','[\"sample\", \"image\", \"gallery\"]','video','https://youtu.be/ZjkYWz53DfU?si=vU8-3qOLdvKzGDXr',0,NULL,'2025-03-28 04:50:32','2025-04-03 07:19:40'),(24,'Youtube sample','erdtcfgvhbjn','[\"hello\", \"gollo\", \"tgeee\"]','video','https://youtu.be/ZjkYWz53DfU?si=vU8-3qOLdvKzGDXr',0,NULL,'2025-03-28 05:04:09','2025-03-28 05:04:09');
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
INSERT INTO `invoices` VALUES (1,1,'INV-20240101',500.00,'paid','2024-01-01','2024-01-15','2024-01-10','credit_card','2025-02-28 09:38:54','2025-02-28 09:38:54'),(2,1,'INV-20240115',1200.50,'pending','2024-01-15','2024-01-30',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54'),(3,1,'INV-20240201',750.00,'overdue','2024-02-01','2024-02-15',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54'),(4,1,'INV-20240215',950.75,'paid','2024-02-15','2024-03-01','2024-02-28','bank_transfer','2025-02-28 09:38:54','2025-02-28 09:38:54'),(5,1,'INV-20240301',1325.40,'pending','2024-03-01','2024-03-15',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54'),(6,1,'INV-20240315',410.25,'paid','2024-03-15','2024-03-31','2024-03-28','paypal','2025-02-28 09:38:54','2025-02-28 09:38:54'),(7,1,'INV-20240401',680.00,'cancelled','2024-04-01','2024-04-15',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54'),(8,1,'INV-20240415',999.99,'paid','2024-04-15','2024-04-30','2024-04-20','other','2025-02-28 09:38:54','2025-02-28 09:38:54'),(9,1,'INV-20240501',1500.00,'pending','2024-05-01','2024-05-15',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54'),(10,1,'INV-20240515',1200.00,'pending','2024-05-15','2024-05-30',NULL,NULL,'2025-02-28 09:38:54','2025-02-28 09:38:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (6,'Password Changed Successfully','Your password was changed successfully on 4/29/2025, 12:27:17 PM. If you didn\'t perform this action, please contact support immediately.','ACCOUNT_UPDATE','MEDIUM',0,'PENDING',23,109,'2025-04-29 06:57:17','2025-04-29 07:24:22','IN_APP',NULL),(7,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-04-29 07:37:15','2025-04-29 07:37:15','IN_APP',NULL),(8,'New Workshop Scheduled: Advanced Machine Learning','A new workshop \"Advanced Machine Learning\" has been scheduled for 4/30/2025 at 9:00:00 AM. Location: San Francisco, USA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,109,'2025-04-29 07:55:15','2025-04-29 07:55:15','IN_APP',NULL),(9,'New Workshop Scheduled: Advanced Machine Learning','A new workshop \"Advanced Machine Learning\" has been scheduled for 4/30/2025 at 9:00:00 AM. Location: San Francisco, USA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,110,'2025-04-29 07:55:15','2025-04-29 07:55:15','IN_APP',NULL),(10,'Workshop Reminder: Advanced Machine Learning','Reminder: Your workshop \"Advanced Machine Learning\" is scheduled for today at 09:00 AM. Location: San Francisco, USA. Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,109,'2025-04-29 08:34:00','2025-04-29 08:34:00','IN_APP',NULL),(11,'Workshop Reminder: Advanced Machine Learning','Reminder: Your workshop \"Advanced Machine Learning\" is scheduled for today at 09:00 AM. Location: San Francisco, USA. Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,110,'2025-04-29 08:34:00','2025-04-29 08:34:00','IN_APP',NULL),(12,'Workshop Cancelled: Advanced Machine Learning','The workshop \"Advanced Machine Learning\" scheduled for Tuesday, April 29, 2025 at 09:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,110,'2025-04-29 08:41:48','2025-04-29 08:41:48','IN_APP',NULL),(13,'Workshop Cancelled: Advanced Machine Learning','The workshop \"Advanced Machine Learning\" scheduled for Tuesday, April 29, 2025 at 09:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,109,'2025-04-29 08:41:48','2025-04-29 08:41:48','IN_APP',NULL),(14,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',1,2,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(18,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,103,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(19,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,105,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(20,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,107,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(21,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,106,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(22,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,104,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(23,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',23,109,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(24,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',23,110,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(25,'New Assessment Available: Title q3q','A new assessment \"Title q3q\" has been assigned to you. \n\nDescription: dcgjvh','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-04-29 09:00:24','2025-04-29 09:00:24','IN_APP',NULL),(26,'Assessment Submission Result: Work-Life Balance Assessment','You have completed the assessment \"Work-Life Balance Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 4 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-04-29 09:03:12','2025-04-29 09:03:12','IN_APP',NULL),(27,'Reward Redemption Alert','Rick has redeemed the reward \"Early Leave Pass\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-04-29 09:07:32','2025-04-29 09:07:32','IN_APP',NULL),(28,'Reward Redemption Alert','Rick has redeemed the reward \"One-Day Work From Home\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-04-29 09:07:42','2025-04-29 09:07:42','IN_APP',NULL),(29,'Reward Redemption Alert','Rick has redeemed the reward \"Surprise Half Day\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-04-30 10:58:37','2025-04-30 10:58:37','IN_APP',NULL),(30,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 4/8/2025 at 3:10:00 AM. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,109,'2025-04-30 11:46:31','2025-04-30 11:46:31','IN_APP',NULL),(31,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 4/8/2025 at 3:10:00 AM. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,110,'2025-04-30 11:46:31','2025-04-30 11:46:31','IN_APP',NULL),(32,'Workshop Cancelled: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" scheduled for Tuesday, April 8, 2025 at 03:10 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,109,'2025-04-30 11:54:02','2025-04-30 11:54:02','IN_APP',NULL),(33,'Workshop Cancelled: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" scheduled for Tuesday, April 8, 2025 at 03:10 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,110,'2025-04-30 11:54:02','2025-04-30 11:54:02','IN_APP',NULL),(34,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/22/2025 at 6:00:00 AM. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,109,'2025-04-30 11:56:47','2025-04-30 11:56:47','IN_APP',NULL),(35,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/22/2025 at 6:00:00 AM. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',23,110,'2025-04-30 11:56:47','2025-04-30 11:56:47','IN_APP',NULL),(36,'New Workshop Scheduled: Unleash your superhero','A new workshop \"Unleash your superhero\" has been scheduled for 4/8/2026 at 5:00:00 AM. Duration: 60 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',24,111,'2025-04-30 12:01:54','2025-04-30 12:01:54','IN_APP',NULL),(37,'Reward Redemption Alert','Rick has redeemed the reward \"One Day Leave Pass\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-04-30 12:42:43','2025-04-30 12:42:43','IN_APP',NULL),(38,'Workshop Reminder: Unleash your superhero','Reminder: Your workshop \"Unleash your superhero\" is scheduled for today at 05:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,109,'2025-04-30 19:30:01','2025-04-30 19:30:01','IN_APP',NULL),(39,'Workshop Reminder: Unleash your superhero','Reminder: Your workshop \"Unleash your superhero\" is scheduled for today at 05:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,110,'2025-04-30 19:30:01','2025-04-30 19:30:01','IN_APP',NULL),(40,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Tuesday, April 8, 2025 at 03:10 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,110,'2025-05-02 09:08:34','2025-05-02 09:08:34','IN_APP',NULL),(41,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Tuesday, April 8, 2025 at 03:10 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,109,'2025-05-02 09:08:34','2025-05-02 09:08:34','IN_APP',NULL),(42,'Workshop Completed: Unleash your superhero','The workshop \"Unleash your superhero\" that was held on Friday, May 9, 2025 at 01:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,109,'2025-05-02 09:09:11','2025-05-02 09:09:11','IN_APP',NULL),(43,'Workshop Completed: Unleash your superhero','The workshop \"Unleash your superhero\" that was held on Friday, May 9, 2025 at 01:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,110,'2025-05-02 09:09:11','2025-05-02 09:09:11','IN_APP',NULL),(44,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/1/2025 at 2:00:00 AM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',6,103,'2025-05-02 09:19:42','2025-05-02 09:19:42','IN_APP',NULL),(45,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/1/2025 at 2:00:00 AM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',6,104,'2025-05-02 09:19:42','2025-05-02 09:19:42','IN_APP',NULL),(46,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/1/2025 at 2:00:00 AM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',6,105,'2025-05-02 09:19:42','2025-05-02 09:19:42','IN_APP',NULL),(47,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/1/2025 at 2:00:00 AM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',6,106,'2025-05-02 09:19:42','2025-05-02 09:19:42','IN_APP',NULL),(48,'New Workshop Scheduled: rioritizing Mental Health in the Workplace','A new workshop \"rioritizing Mental Health in the Workplace\" has been scheduled for 5/1/2025 at 2:00:00 AM. Duration: 120 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',6,107,'2025-05-02 09:19:42','2025-05-02 09:19:42','IN_APP',NULL),(49,'Workshop Completed: Unleash your superhero','The workshop \"Unleash your superhero\" that was held on Friday, May 9, 2025 at 01:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,109,'2025-05-02 09:27:01','2025-05-02 09:27:01','IN_APP',NULL),(50,'Workshop Completed: Unleash your superhero','The workshop \"Unleash your superhero\" that was held on Friday, May 9, 2025 at 01:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',23,110,'2025-05-02 09:27:01','2025-05-02 09:27:01','IN_APP',NULL),(51,'Reward Redemption Alert','Rick has redeemed the reward \"One-Day Work From Home\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-05-05 05:11:32','2025-05-05 05:11:32','IN_APP',NULL),(52,'Reward Redemption Alert','Rick has redeemed the reward \"One-Day Work From Home\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-05-05 05:11:35','2025-05-05 05:11:35','IN_APP',NULL),(53,'Reward Redemption Alert','Rick has redeemed the reward \"Early Leave Pass\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-05-05 05:11:45','2025-05-05 05:11:45','IN_APP',NULL),(54,'Reward Redemption Alert','Rick has redeemed the reward \"1-on-1 mentorship session with a Senior Executive\" that was assigned by Rick.','REWARD_REDEMPTION','MEDIUM',0,'PENDING',23,109,'2025-05-05 05:12:31','2025-05-05 05:12:31','IN_APP',NULL),(55,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 06:54:52','2025-05-05 06:54:52','IN_APP',NULL),(56,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:05:44','2025-05-05 07:05:44','IN_APP',NULL),(57,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:30:31','2025-05-05 07:30:31','IN_APP',NULL),(58,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:32:23','2025-05-05 07:32:23','IN_APP',NULL),(59,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:33:08','2025-05-05 07:33:08','IN_APP',NULL),(60,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:35:33','2025-05-05 07:35:33','IN_APP',NULL),(61,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:37:06','2025-05-05 07:37:06','IN_APP',NULL),(62,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:37:29','2025-05-05 07:37:29','IN_APP',NULL),(63,'Profile Update','Your profile information has been updated. Updated fields: email','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:40:53','2025-05-05 07:40:53','IN_APP',NULL),(64,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:44:42','2025-05-05 07:44:42','IN_APP',NULL),(65,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:48:11','2025-05-05 07:48:11','IN_APP',NULL),(66,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:52:53','2025-05-05 07:52:53','IN_APP',NULL),(67,'Profile Update','Your profile information has been updated. Updated fields: first_name, last_name, email, phone, gender, date_of_birth, city','PROFILE_UPDATE','MEDIUM',0,'PENDING',NULL,110,'2025-05-05 07:54:43','2025-05-05 07:54:43','IN_APP',NULL),(68,'Workshop Cancelled: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" scheduled for Friday, May 9, 2025 at 03:02 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,110,'2025-05-05 09:19:11','2025-05-05 09:19:11','IN_APP',NULL),(69,'Workshop Cancelled: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" scheduled for Friday, May 9, 2025 at 03:02 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,109,'2025-05-05 09:19:11','2025-05-05 09:19:11','IN_APP',NULL),(70,'Workshop Cancelled: Unleash your superhero','The workshop \"Unleash your superhero\" scheduled for Monday, May 12, 2025 at 02:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,109,'2025-05-05 09:54:08','2025-05-05 09:54:08','IN_APP',NULL),(71,'Workshop Cancelled: Unleash your superhero','The workshop \"Unleash your superhero\" scheduled for Monday, May 12, 2025 at 02:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,110,'2025-05-05 09:54:08','2025-05-05 09:54:08','IN_APP',NULL),(72,'Workshop Cancelled: Unleash your superhero','The workshop \"Unleash your superhero\" scheduled for Thursday, May 22, 2025 at 03:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,109,'2025-05-05 09:57:38','2025-05-05 09:57:38','IN_APP',NULL),(73,'Workshop Cancelled: Unleash your superhero','The workshop \"Unleash your superhero\" scheduled for Thursday, May 22, 2025 at 03:00 AM has been cancelled. ','WORKSHOP_CANCELLED','MEDIUM',0,'PENDING',23,110,'2025-05-05 09:57:38','2025-05-05 09:57:38','IN_APP',NULL),(74,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Thursday, May 1, 2025 at 02:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',6,106,'2025-05-05 10:00:54','2025-05-05 10:00:54','IN_APP',NULL),(75,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Thursday, May 1, 2025 at 02:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',6,103,'2025-05-05 10:00:54','2025-05-05 10:00:54','IN_APP',NULL),(76,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Thursday, May 1, 2025 at 02:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',6,105,'2025-05-05 10:00:54','2025-05-05 10:00:54','IN_APP',NULL),(77,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Thursday, May 1, 2025 at 02:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',6,104,'2025-05-05 10:00:54','2025-05-05 10:00:54','IN_APP',NULL),(78,'Workshop Completed: rioritizing Mental Health in the Workplace','The workshop \"rioritizing Mental Health in the Workplace\" that was held on Thursday, May 1, 2025 at 02:00 AM has been marked as completed. Thank you for your participation.','WORKSHOP_COMPLETED','MEDIUM',0,'PENDING',6,107,'2025-05-05 10:00:55','2025-05-05 10:00:55','IN_APP',NULL),(79,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,103,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(80,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',1,2,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(81,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,105,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(82,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,104,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(83,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',24,111,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(84,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,106,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(85,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',23,110,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(86,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',6,107,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(87,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',23,109,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(88,'New Assessment Available: hjbhj','A new assessment \"hjbhj\" has been assigned to you. \n\nDescription: jgvhj','NEW_ASSESSMENT','MEDIUM',0,'PENDING',25,125,'2025-05-05 11:30:09','2025-05-05 11:30:09','IN_APP',NULL),(89,'Assessment Submission Result: Stress Management Assessment','You have completed the assessment \"Stress Management Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-05 12:32:50','2025-05-05 12:32:50','IN_APP',NULL),(90,'Assessment Submission Result: General Mental Well-Being Assessment','You have completed the assessment \"General Mental Well-Being Assessment\" with a score of 100.0%. \n                 Correct answers: 6 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-05 12:34:00','2025-05-05 12:34:00','IN_APP',NULL),(91,'Assessment Submission Result: Anxiety Level Assessment','You have completed the assessment \"Anxiety Level Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-05 13:04:13','2025-05-05 13:04:13','IN_APP',NULL),(92,'Assessment Submission Result: Depression Screening Test','You have completed the assessment \"Depression Screening Test\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-05 13:06:51','2025-05-05 13:06:51','IN_APP',NULL),(93,'Assessment Submission Result: General Mental Well-Being Assessment','You have completed the assessment \"General Mental Well-Being Assessment\" with a score of 83.3%. \n                 Correct answers: 5 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-05 13:08:11','2025-05-05 13:08:11','IN_APP',NULL),(94,'Assessment Submission Result: Anxiety Level Assessment','You have completed the assessment \"Anxiety Level Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 04:29:04','2025-05-06 04:29:04','IN_APP',NULL),(95,'Assessment Submission Result: Anxiety Level Assessment','You have completed the assessment \"Anxiety Level Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 04:31:40','2025-05-06 04:31:40','IN_APP',NULL),(96,'Assessment Submission Result: General Mental Well-Being Assessment','You have completed the assessment \"General Mental Well-Being Assessment\" with a score of 100.0%. \n                 Correct answers: 6 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 04:34:00','2025-05-06 04:34:00','IN_APP',NULL),(97,'Assessment Submission Result: General Mental Well-Being Assessment','You have completed the assessment \"General Mental Well-Being Assessment\" with a score of 66.7%. \n                 Correct answers: 4 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 06:18:46','2025-05-06 06:18:46','IN_APP',NULL),(98,'Assessment Submission Result: Anxiety Level Assessment','You have completed the assessment \"Anxiety Level Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 06:18:58','2025-05-06 06:18:58','IN_APP',NULL),(99,'Assessment Submission Result: Stress Management Assessment','You have completed the assessment \"Stress Management Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 06:19:14','2025-05-06 06:19:14','IN_APP',NULL),(100,'Assessment Submission Result: Depression Screening Test','You have completed the assessment \"Depression Screening Test\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 07:35:51','2025-05-06 07:35:51','IN_APP',NULL),(101,'Assessment Submission Result: Work-Life Balance Assessment','You have completed the assessment \"Work-Life Balance Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 4 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 07:37:07','2025-05-06 07:37:07','IN_APP',NULL),(102,'Assessment Submission Result: Work-Life Balance Assessment','You have completed the assessment \"Work-Life Balance Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 4 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 07:40:25','2025-05-06 07:40:25','IN_APP',NULL),(103,'Assessment Submission Result: General Mental Well-Being Assessment','You have completed the assessment \"General Mental Well-Being Assessment\" with a score of 83.3%. \n                 Correct answers: 5 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 07:42:44','2025-05-06 07:42:44','IN_APP',NULL),(104,'Assessment Submission Result: Anxiety Level Assessment','You have completed the assessment \"Anxiety Level Assessment\" with a score of 0.0%. \n                 Correct answers: 0 out of 6 questions.','ASSESSMENT_COMPLETED','MEDIUM',0,'PENDING',1,110,'2025-05-06 07:46:54','2025-05-06 07:46:54','IN_APP',NULL),(105,'New Workshop Scheduled: Unleash your superhero','A new workshop \"Unleash your superhero\" has been scheduled for 5/10/2025 at 1:57:56 PM. Duration: 44 minutes. Location: TBA','WORKSHOP_SCHEDULED','MEDIUM',0,'PENDING',25,125,'2025-05-06 08:28:05','2025-05-06 08:28:05','IN_APP',NULL),(106,'Workshop Reminder: Unleash your superhero','Reminder: Your workshop \"Unleash your superhero\" is scheduled for today at 03:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,110,'2025-05-06 19:30:01','2025-05-06 19:30:01','IN_APP',NULL),(107,'Workshop Reminder: Unleash your superhero','Reminder: Your workshop \"Unleash your superhero\" is scheduled for today at 03:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,109,'2025-05-06 19:30:01','2025-05-06 19:30:01','IN_APP',NULL),(108,'Workshop Reminder: rioritizing Mental Health in the Workplace','Reminder: Your workshop \"rioritizing Mental Health in the Workplace\" is scheduled for today at 03:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,110,'2025-05-06 19:30:02','2025-05-06 19:30:02','IN_APP',NULL),(109,'Workshop Reminder: rioritizing Mental Health in the Workplace','Reminder: Your workshop \"rioritizing Mental Health in the Workplace\" is scheduled for today at 03:00 AM. . Duration: undefined minutes','WORKSHOP_REMINDER','MEDIUM',0,'PENDING',23,109,'2025-05-06 19:30:02','2025-05-06 19:30:02','IN_APP',NULL);
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
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `options`
--

LOCK TABLES `options` WRITE;
/*!40000 ALTER TABLE `options` DISABLE KEYS */;
INSERT INTO `options` VALUES (28,11,'Rarely',1),(29,11,'Sometimes',0),(30,11,'Often',0),(31,11,'Almost always',0),(32,12,'Happy and content',1),(33,12,'Neutral',0),(34,12,'Anxious or worried',0),(35,12,'Sad or depressed',0),(36,13,'Exercise or physical activity',1),(37,13,'Talking to a friend or therapist',0),(38,13,'Avoiding the problem',0),(39,13,'Using substances (alcohol, drugs, etc.)',0),(40,14,'Never',1),(41,14,'Occasionally',0),(42,14,'Frequently',0),(43,14,'Always',0),(44,15,'Never',1),(45,15,'Sometimes',0),(46,15,'Often',0),(47,15,'Always',0),(48,16,'Listening to music',1),(49,16,'Meditation or mindfulness',0),(50,16,'Eating comfort food',0),(51,16,'Socializing with friends',0),(52,17,'Rarely',0),(53,17,'Sometimes',0),(54,17,'Frequently',0),(55,17,'Almost always',0),(56,18,'Social interactions',0),(57,18,'Public speaking',0),(58,18,'Work deadlines',0),(59,18,'Unexpected changes',0),(60,19,'No',0),(61,19,'Mild symptoms',0),(62,19,'Moderate symptoms',0),(63,19,'Severe symptoms',0),(64,20,'Distracting myself',0),(65,20,'Talking to someone',0),(66,20,'Avoiding the situation',0),(67,20,'Using relaxation techniques',0),(68,21,'Never',0),(69,21,'Occasionally',0),(70,21,'Frequently',0),(71,21,'Always',0),(72,22,'Breathing exercises',0),(73,22,'Yoga or stretching',0),(74,22,'Journaling',0),(75,22,'None of the above',0),(76,23,'Never',0),(77,23,'Occasionally',0),(78,23,'Frequently',0),(79,23,'Almost always',0),(80,24,'Not at all',0),(81,24,'Somewhat',0),(82,24,'Quite a bit',0),(83,24,'Completely',0),(84,25,'Talking to friends or family',0),(85,25,'Engaging in a hobby',0),(86,25,'Sleeping more than usual',0),(87,25,'Withdrawing from social activities',0),(88,26,'Never',0),(89,26,'Sometimes',0),(90,26,'Most of the time',0),(91,26,'Always',0),(92,27,'Never',0),(93,27,'Occasionally',0),(94,27,'Frequently',0),(95,27,'Always',0),(96,28,'Changes in appetite',0),(97,28,'Feeling worthless or guilty',0),(98,28,'Trouble sleeping',0),(99,28,'None of the above',0),(100,29,'Rarely',0),(101,29,'Sometimes',0),(102,29,'Often',0),(103,29,'Almost always',0),(104,30,'Work-related pressure',0),(105,30,'Personal relationships',0),(106,30,'Financial worries',0),(107,30,'Health concerns',0),(108,31,'Remain calm and find solutions',0),(109,31,'Get anxious but manage it',0),(110,31,'Feel overwhelmed and struggle',0),(111,31,'Completely shut down',0),(112,32,'Meditation or deep breathing',0),(113,32,'Exercise or yoga',0),(114,32,'Listening to music or reading',0),(115,32,'None of the above',0),(116,33,'Never',0),(117,33,'Occasionally',0),(118,33,'Frequently',0),(119,33,'Always',0),(120,34,'Time management strategies',0),(121,34,'Therapy or counseling',0),(122,34,'Support from friends or family',0),(123,34,'Lifestyle changes (diet, exercise)',0),(124,35,'Never',0),(125,35,'Sometimes',0),(126,35,'Frequently',0),(127,35,'Almost always',0),(128,36,'Work deadlines',0),(129,36,'Personal time and hobbies',0),(130,36,'Family commitments',0),(131,36,'Health and fitness',0),(132,37,'Never',0),(133,37,'Occasionally',0),(134,37,'Frequently',0),(135,37,'Always',0),(136,38,'Spending time with family',0),(137,38,'Engaging in hobbies',0),(138,38,'Watching TV or gaming',0),(139,38,'I rarely have time to unwind',0),(150,44,'Option 1',0),(151,44,'Option 2',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (11,7,'How often do you feel overwhelmed with daily tasks?','single_choice'),(12,7,'Which of the following best describes your recent mood?','single_choice'),(13,7,'How do you usually cope with stress? (Select all that apply)','multiple_choice'),(14,7,'Do you have trouble sleeping due to stress or anxiety?','single_choice'),(15,7,'How often do you feel socially isolated or lonely?','single_choice'),(16,7,'Which activities help improve your mood? (Select all that apply)','multiple_choice'),(17,8,'How often do you feel nervous or on edge?','single_choice'),(18,8,'What situations make you feel the most anxious? (Select all that apply)','multiple_choice'),(19,8,'Do you experience physical symptoms when anxious?','single_choice'),(20,8,'How do you usually deal with anxious thoughts?','multiple_choice'),(21,8,'Do you have difficulty concentrating due to anxiety?','single_choice'),(22,8,'Which of these relaxation techniques have you tried? (Select all that apply)','multiple_choice'),(23,9,'How often do you feel sad or hopeless?','single_choice'),(24,9,'Have you lost interest in activities you once enjoyed?','single_choice'),(25,9,'What are your common coping mechanisms? (Select all that apply)','multiple_choice'),(26,9,'How often do you experience fatigue even after resting?','single_choice'),(27,9,'Do you have trouble concentrating or making decisions?','single_choice'),(28,9,'Which symptoms have you experienced in the past month? (Select all that apply)','multiple_choice'),(29,10,'How frequently do you feel stressed?','single_choice'),(30,10,'What are your common stress triggers? (Select all that apply)','multiple_choice'),(31,10,'How do you typically respond to stressful situations?','single_choice'),(32,10,'What relaxation techniques have you used? (Select all that apply)','multiple_choice'),(33,10,'Do you experience physical symptoms due to stress?','single_choice'),(34,10,'Which of the following do you believe would help reduce your stress? (Select all that apply)','multiple_choice'),(35,11,'How often do you work outside of office hours?','single_choice'),(36,11,'What do you prioritize when making a schedule? (Select all that apply)','multiple_choice'),(37,11,'Do you feel like work negatively impacts your personal life?','single_choice'),(38,11,'How do you unwind after work? (Select all that apply)','multiple_choice'),(44,17,'vhgvvvv','single_choice');
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
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=696 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (619,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwMDM1MzUsImV4cCI6MTc0NjYwODMzNX0.T-_7moNULkehVgkBymNomyAzjLnEsJi5F6GIJuD7v2g','2025-05-07 08:58:56','2025-04-30 08:58:55'),(620,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwMDM1MzYsImV4cCI6MTc0NjYwODMzNn0.y8NimavUn3w7QJqrasTlh4HF-TVmLM65JOdc0ZQU9IE','2025-05-07 08:58:57','2025-04-30 08:58:56'),(621,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjAwODAzMywiZXhwIjoxNzQ2NjEyODMzfQ.Pcf63GZiL-YFA3_oJBW2DH9vDOwlgWRbruja6IB41Cc','2025-05-07 15:43:53','2025-04-30 10:13:53'),(622,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjAxMDY3NCwiZXhwIjoxNzQ2NjE1NDc0fQ.EmVHfEseJrgmz85ksNRCGJRrqreUHalqDrdcRFa4qlQ','2025-05-07 16:27:54','2025-04-30 10:57:54'),(623,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjAxNTgxOCwiZXhwIjoxNzQ2NjIwNjE4fQ.GLamCRLkbEmKeUhgLaxNtQCXl2agcV6BG0lp7-Ni7BQ','2025-05-07 12:23:38','2025-04-30 12:23:38'),(624,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjAxNTg1NiwiZXhwIjoxNzQ2NjIwNjU2fQ.B1HpPO__bAESMKM5WvRf-H3iQuMjMQDSSG66qFScJyU','2025-05-07 12:24:17','2025-04-30 12:24:16'),(625,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjA4MzczNSwiZXhwIjoxNzQ2Njg4NTM1fQ.hCUsLitGRuvG-00sd2PwWXzumO-8XH_y8HORE_D_Xhc','2025-05-08 07:15:36','2025-05-01 07:15:35'),(626,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjA4OTAwOSwiZXhwIjoxNzQ2NjkzODA5fQ.l8zEonjv9wQg_4CrpmGyo7e7VQMLWYnbTs1-88I7qY4','2025-05-08 08:43:30','2025-05-01 08:43:29'),(627,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTIzNzQsImV4cCI6MTc0NjY5NzE3NH0.4cmKoiLxbv36xNRyvAT51K73eNoaj6_LL-QR5jHBVdY','2025-05-08 09:39:34','2025-05-01 09:39:34'),(628,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTIzNzYsImV4cCI6MTc0NjY5NzE3Nn0.6LDKiQMm5IhNg-eQvuTt7lrC-nl8UN3WPuf0l4dH9b4','2025-05-08 09:39:36','2025-05-01 09:39:36'),(629,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTQ5NzUsImV4cCI6MTc0NjY5OTc3NX0.GPq0fqYpGnT8qc4qR_0O4b0w08ravaMXQf5sizxVtMc','2025-05-08 10:22:56','2025-05-01 10:22:55'),(630,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYwOTQ5NzYsImV4cCI6MTc0NjY5OTc3Nn0.YtS7_1mVq37XH1qG22459K3PmteKsAXUptl5mhqyPx0','2025-05-08 10:22:56','2025-05-01 10:22:56'),(631,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTMsImV4cCI6MTc0Njc2NzgxM30.30y3AHu-AhdGlhuln2Md9UJyHsIijuaPh6ZYKAG09Nw','2025-05-09 05:16:53','2025-05-02 05:16:53'),(632,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTQsImV4cCI6MTc0Njc2NzgxNH0.oHXZ7i28XcT9qgWjAH6dydDLlmByMRi0J9z2544ayJ0','2025-05-09 05:16:54','2025-05-02 05:16:54'),(633,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjMwMTUsImV4cCI6MTc0Njc2NzgxNX0.ya8URPeISjxEgHoZ4gh_FiF-MH3GEuUZpd4Xb6_MJGU','2025-05-09 05:16:55','2025-05-02 05:16:55'),(634,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2MzA5NCwiZXhwIjoxNzQ2NzY3ODk0fQ.htRzCvRPv_3U0zWSxskEt7xpd74-VPTpJcK9uzcIbm8','2025-05-09 05:18:14','2025-05-02 05:18:14'),(635,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2MzEzOCwiZXhwIjoxNzQ2NzY3OTM4fQ.2qt6CpKZ4lJo3HLYyy2OQVXztwfIXsXFqZ9J7Pxa13s','2025-05-09 05:18:58','2025-05-02 05:18:58'),(636,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxNjQ4ODUsImV4cCI6MTc0Njc2OTY4NX0.Rc4HFshK_AwR2SV8i1_DTsWuwveGi0eSexlT7IbIzpw','2025-05-09 05:48:06','2025-05-02 05:48:05'),(637,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjE2NTEyMCwiZXhwIjoxNzQ2NzY5OTIwfQ.YeVVx7KqM3-ulV9wRXqx7YZ0Q2DU0mSnJj6V7HUKX0Q','2025-05-09 05:52:00','2025-05-02 05:52:00'),(638,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE2OTU2OCwiZXhwIjoxNzQ2Nzc0MzY4fQ.1fpkTLM_eoAZ3UmJaKQVtS5T8mtdMC-ot_5gujkjWBg','2025-05-09 07:06:08','2025-05-02 07:06:08'),(639,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjE4MTA5OCwiZXhwIjoxNzQ2Nzg1ODk4fQ.7r-xlFeXKt6vLY_NBZMd-Z9QS2eM0rQyh7_ttyIPjiw','2025-05-09 15:48:19','2025-05-02 10:18:18'),(640,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYxODMzODMsImV4cCI6MTc0Njc4ODE4M30.wuWv9n8AEmo0PFYd1pqpe6f8FfTCa50YNe-uwXXLaso','2025-05-09 16:26:24','2025-05-02 10:56:23'),(641,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjE4NDM1OSwiZXhwIjoxNzQ2Nzg5MTU5fQ.SbbsEZ_ee9t9svQrpEinNauqxNNSDQLP-2mOWP1cB5Q','2025-05-09 16:42:40','2025-05-02 11:12:39'),(642,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjI1NDMyNywiZXhwIjoxNzQ2ODU5MTI3fQ.XgGhQZYUOWaXofonhGIdl8qdfosXGLkUXJ6TnTkgDTg','2025-05-10 06:38:48','2025-05-03 06:38:48'),(643,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYyNzgzMzksImV4cCI6MTc0Njg4MzEzOX0.qGg-yssGLmgOO3eKMGIf2KbNPFr2xzh2nySXmzjDam0','2025-05-10 13:19:00','2025-05-03 13:19:00'),(644,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDYyNzgzNDAsImV4cCI6MTc0Njg4MzE0MH0.W201KXTOI2PU1rNe2DRvmtWY4YsjGGgLPkyHWt9K-Qs','2025-05-10 13:19:00','2025-05-03 13:19:00'),(645,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjA3MzUsImV4cCI6MTc0NzAyNTUzNX0.3hGOfgS-02uqdBpy4BmE1y8_SUuBBfqAwb5iHN48mh4','2025-05-12 10:22:16','2025-05-05 04:52:15'),(646,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMTg3MCwiZXhwIjoxNzQ3MDI2NjcwfQ.VJy710v8cJBqps385vQmfhM4pJIdQh5DGM-1UalI34c','2025-05-12 10:41:11','2025-05-05 05:11:10'),(647,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyMjQ0OSwiZXhwIjoxNzQ3MDI3MjQ5fQ.MOyZsCBz7pvhfT2Iry2p942EztqMonywbWxfijwMgDk','2025-05-12 10:50:50','2025-05-05 05:20:49'),(648,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMjQ4OCwiZXhwIjoxNzQ3MDI3Mjg4fQ.llCUflTp49YPLI2BVNfL9i_9pIAcmc4MKZMyrbWXW8c','2025-05-12 10:51:28','2025-05-05 05:21:28'),(649,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyMzM3MywiZXhwIjoxNzQ3MDI4MTczfQ.iRV_Q3lZfWbboUqa5QLsuz-sDzIBDR86mlFpG0r4GbI','2025-05-12 11:06:14','2025-05-05 05:36:13'),(650,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyMzY0NywiZXhwIjoxNzQ3MDI4NDQ3fQ.BU64OZ-l2cYD1p0oT71_nfS82wfjF_8Clm-jVRSgDFw','2025-05-12 11:10:48','2025-05-05 05:40:47'),(651,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQyNjM1MSwiZXhwIjoxNzQ3MDMxMTUxfQ.SO4XktdscLVKFYnLzQK5N076W-cr0m6U6-5eQK0nzvc','2025-05-12 06:25:51','2025-05-05 06:25:51'),(652,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQyNzgzMCwiZXhwIjoxNzQ3MDMyNjMwfQ.AwWNguPeHPvpEidXYhpdt_sM0mWk4QY3-p54PfSzEis','2025-05-12 12:20:30','2025-05-05 06:50:30'),(653,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjkyNjksImV4cCI6MTc0NzAzNDA2OX0.wBh5Ps-WEHl1Z0XZjVDFB1cQwNffY8CD7uEV3f8RQLw','2025-05-12 07:14:30','2025-05-05 07:14:29'),(654,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MjkyNjksImV4cCI6MTc0NzAzNDA2OX0.wBh5Ps-WEHl1Z0XZjVDFB1cQwNffY8CD7uEV3f8RQLw','2025-05-12 07:14:30','2025-05-05 07:14:29'),(655,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjQzMDg3MiwiZXhwIjoxNzQ3MDM1NjcyfQ.sLFVlVq3braISnqP06TA6fgIlmKHTPkMPPO9genP1gI','2025-05-12 07:41:12','2025-05-05 07:41:12'),(656,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjUsImV4cCI6MTc0NzAzNzM2NX0.qBje_dRz7m3QpBK4q8xKz0CxwwfuCSjPI87n08eHeYs','2025-05-12 13:39:25','2025-05-05 08:09:25'),(657,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjYsImV4cCI6MTc0NzAzNzM2Nn0.94HRowkkOrmOYY2-5qHZjQjriOUmQMGdxiX9SFcv7L4','2025-05-12 13:39:26','2025-05-05 08:09:26'),(658,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzI1NjYsImV4cCI6MTc0NzAzNzM2Nn0.94HRowkkOrmOYY2-5qHZjQjriOUmQMGdxiX9SFcv7L4','2025-05-12 13:39:26','2025-05-05 08:09:26'),(659,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0Mzg3NzMsImV4cCI6MTc0NzA0MzU3M30.nbWtw30HmD3a6sLiuo9fJNp2zIKbGbiBvJSQzzEpyiI','2025-05-12 09:52:54','2025-05-05 09:52:53'),(660,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0Mzg3NzQsImV4cCI6MTc0NzA0MzU3NH0.1a8o3f4QFEMCQW8s3Ce1xeIx1G2BrdGsBXhghD9cbq0','2025-05-12 09:52:54','2025-05-05 09:52:54'),(661,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzkxNjQsImV4cCI6MTc0NzA0Mzk2NH0.fPdPFkWdkpj8KmR1O-Xv6joB8duLwX84_6K_6upxsyQ','2025-05-12 09:59:25','2025-05-05 09:59:24'),(662,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0MzkxNjUsImV4cCI6MTc0NzA0Mzk2NX0.14RoZg-fOLTVBCHBIAxU2xt_ET63f5Oh862GY7Rp0Ao','2025-05-12 09:59:25','2025-05-05 09:59:25'),(663,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY0NDU3NDcsImV4cCI6MTc0NzA1MDU0N30.HVSAvsQYymUkfjmMZ8bPRC4toa23aobknBUSPUgo2t0','2025-05-12 17:19:07','2025-05-05 11:49:07'),(664,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQ0Njk0OSwiZXhwIjoxNzQ3MDUxNzQ5fQ.30r64IH23V5-ZX-rpTEVPe98sHh8PMpWy4_mEOk2BX4','2025-05-12 17:39:10','2025-05-05 12:09:09'),(665,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjQ0ODI5OSwiZXhwIjoxNzQ3MDUzMDk5fQ.hd4KfpILGyvIdgT3YolGznw1hAvn--hibhevMFZUrb4','2025-05-12 18:01:39','2025-05-05 12:31:39'),(666,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MDQ3NTMsImV4cCI6MTc0NzEwOTU1M30.2q3UvBqsABGq2DvkYq1WtOM70U7CJebFw7aERMmI_pU','2025-05-13 09:42:34','2025-05-06 04:12:33'),(667,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNTcxNywiZXhwIjoxNzQ3MTEwNTE3fQ.mitOg2vQS13WdZy1f-GiUUfvStym3q-D47FpzG66528','2025-05-13 04:28:37','2025-05-06 04:28:37'),(668,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNjEwNiwiZXhwIjoxNzQ3MTEwOTA2fQ.TRAdFyFuZlCGvIpE5TugN5ZbCqyQqY6Rr6_WBqDPZns','2025-05-13 10:05:06','2025-05-06 04:35:06'),(669,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUwNjMyMiwiZXhwIjoxNzQ3MTExMTIyfQ.Bw3mExnyTVEOdgtMPwW-Ncc4s99CY8Oi_1rUDkFu5SE','2025-05-13 10:08:43','2025-05-06 04:38:42'),(670,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUwODAzNSwiZXhwIjoxNzQ3MTEyODM1fQ.8IosQ-7b7JOzxcFQnCP9vZ_WP-ALAGVzyEQj9wlUME0','2025-05-13 10:37:15','2025-05-06 05:07:15'),(671,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUyMjg0NiwiZXhwIjoxNzQ3MTI3NjQ2fQ.DFCwung4Yuu8xlsG8L55tNgnkfMJjiRiCgjmFlKBRoY','2025-05-13 09:14:07','2025-05-06 09:14:06'),(672,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUyMjg3OSwiZXhwIjoxNzQ3MTI3Njc5fQ.pmi5Gh3GrlIEVexvG_0Htgnkdev3uz8aZHTOQIv2_uc','2025-05-13 14:44:39','2025-05-06 09:14:39'),(673,109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDksInJvbGVfaWQiOjIsImlhdCI6MTc0NjUyNTE0NCwiZXhwIjoxNzQ3MTI5OTQ0fQ.MEUMEL8mRCyLII5QjmeSpls0h3Sf-tTbrafxWwo9usU','2025-05-13 09:52:24','2025-05-06 09:52:24'),(674,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1Mjg3MDQsImV4cCI6MTc0NzEzMzUwNH0.e84crC2563JPNY38fCNTkah8UcSQJO2GrtcroUL1cVo','2025-05-13 10:51:44','2025-05-06 10:51:44'),(675,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1Mjg3MDQsImV4cCI6MTc0NzEzMzUwNH0.e84crC2563JPNY38fCNTkah8UcSQJO2GrtcroUL1cVo','2025-05-13 10:51:44','2025-05-06 10:51:44'),(676,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkwNDEsImV4cCI6MTc0NzEzMzg0MX0.cN8jPD2aa6Qt7quYfMZIzcdQ0xfbVCjp-1jBmLwydf4','2025-05-13 16:27:21','2025-05-06 10:57:21'),(677,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDgsImV4cCI6MTc0NzEzNDE0OH0.A3isy_-HsWxYnVJuU81qrgwxHPnBIeFXwy-zSmwnMbc','2025-05-13 11:02:28','2025-05-06 11:02:28'),(678,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDgsImV4cCI6MTc0NzEzNDE0OH0.A3isy_-HsWxYnVJuU81qrgwxHPnBIeFXwy-zSmwnMbc','2025-05-13 11:02:28','2025-05-06 11:02:28'),(679,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1MjkzNDksImV4cCI6MTc0NzEzNDE0OX0.-AtC28GgLkGI0oIdkdVVPeikJzAqocHL_kO06A5Ff_g','2025-05-13 11:02:29','2025-05-06 11:02:29'),(680,110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTAsInJvbGVfaWQiOjMsImlhdCI6MTc0NjUzMDc5MCwiZXhwIjoxNzQ3MTM1NTkwfQ.8k7SqY9MZ7fj7NfP35RcJwUBdKNGTL0ubR2esH57Rxk','2025-05-13 16:56:31','2025-05-06 11:26:30'),(681,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NTcyNzYsImV4cCI6MTc0NzE2MjA3Nn0.U6r960XKrRCA8ISxb8ufzYkhxl3i77h2Mf9uzp-4OVo','2025-05-13 18:47:56','2025-05-06 18:47:56'),(682,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NTcyNzYsImV4cCI6MTc0NzE2MjA3Nn0.U6r960XKrRCA8ISxb8ufzYkhxl3i77h2Mf9uzp-4OVo','2025-05-13 18:47:56','2025-05-06 18:47:56'),(683,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:39','2025-05-06 19:59:39'),(684,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:39','2025-05-06 19:59:39'),(685,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjE1NzksImV4cCI6MTc0NzE2NjM3OX0.uyyEdY9xSP3YTSPHS6cTeNqz2lkt8BRG6GWx5cFt-sI','2025-05-13 19:59:40','2025-05-06 19:59:39'),(686,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjI1NTcsImV4cCI6MTc0NzE2NzM1N30.8F5zhDYQUs40JfTykPjmYQce1fEuD4JO3C6omVR6Tj4','2025-05-13 20:15:58','2025-05-06 20:15:57'),(687,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1NjI1NTcsImV4cCI6MTc0NzE2NzM1N30.8F5zhDYQUs40JfTykPjmYQce1fEuD4JO3C6omVR6Tj4','2025-05-13 20:15:58','2025-05-06 20:15:58'),(688,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTIxNTEsImV4cCI6MTc0NzE5Njk1MX0.466E0EQWeUmUBZxx_eLrkIUx4YyYUtNZby5IHmNuiTs','2025-05-14 04:29:12','2025-05-07 04:29:11'),(689,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTIxNTIsImV4cCI6MTc0NzE5Njk1Mn0.dEExiLTB6KYejv7-9m-ZA9RzanmomhRV4uYCs33oonY','2025-05-14 04:29:12','2025-05-07 04:29:12'),(690,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTU5OTMsImV4cCI6MTc0NzIwMDc5M30.WHQNKLI9Xxvs7Bi8iiH6eQP8JqLDki5v4_wltBZm3dU','2025-05-14 05:33:14','2025-05-07 05:33:13'),(691,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTg4NDAsImV4cCI6MTc0NzIwMzY0MH0.cWZzm-N5MwJZU-SOJYogQnfodbvlvnpPIvskngZuYtQ','2025-05-14 06:20:41','2025-05-07 06:20:40'),(692,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzMsImV4cCI6MTc0NzIwNDEzM30.WZ85bQKKQGZJe79JxCfd4IzluGVYgYUQ13yyRlHP_XU','2025-05-14 06:28:54','2025-05-07 06:28:54'),(693,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzcsImV4cCI6MTc0NzIwNDEzN30.UdRT4ew5Z8a5DMgaQS7TpiWZk_yKBbzs1ON-Lr3ktyE','2025-05-14 06:28:58','2025-05-07 06:28:57'),(694,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzgsImV4cCI6MTc0NzIwNDEzOH0.gUUFVRTD80Ml91O5Qv86J1k11qEggvli7prXsc5bSXU','2025-05-14 06:28:58','2025-05-07 06:28:58'),(695,4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJyb2xlX2lkIjoxLCJpYXQiOjE3NDY1OTkzMzksImV4cCI6MTc0NzIwNDEzOX0.I_aJHUIttrOjXfSuiPKmjCSwWyYmYyVH26T8tRdkk2M','2025-05-14 06:28:59','2025-05-07 06:28:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
INSERT INTO `rewards` VALUES (1,'One-Day Work From Home','1. The pass can be redeemed with a minimum of 24 hours’ notice, subject to approval based on work schedules and team availability.\r\n2. Employees must remain accessible and responsive during working hours to ensure collaboration and productivity.\r\n3. All meetings, deadlines, and assigned tasks must be completed as per schedule, just like an in-office workday.\r\n4. The pass cannot be combined with paid leave, sick leave, or other time-off requests to extend a break.\r\n5. On critical business days (such as company-wide events, client meetings, or deadlines), managers may request an alternate WFH date.\r\n6. The pass cannot be transferred or gifted to another employee and is meant for individual use only.\r\n7. Employees must log their working hours and daily progress in the designated system or report to their manager as required.\r\n8. The company reserves the right to suspend or modify this benefit if it is misused or affects business operations.\r\n9. The WFH pass is a privilege aimed at enhancing work-life balance—employees are expected to use it responsibly and ethically.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/4HBcoHXy9HUt-nTcw6tsq.jpg','global','2025-02-26 07:52:09','2025-05-05 11:04:36'),(2,'Flexible Working Hours for a Day','1. Employees must request approval from their immediate manager at least 24 hours in advance to ensure that their schedule adjustment does not impact team operations.\n2. A minimum of 6 hours of productive work must be completed during the day.\n3. Employees must communicate their chosen work hours to their team and manager, ensuring everyone is aligned on availability for meetings or urgent tasks.\n4. Employees should ensure that their flexible working hours do not disrupt team collaboration, meetings, or business-critical activities. Flexibility should enhance productivity, not hinder team efforts.\n5. The Flexible Work Hours Day Pass can be used only once and cannot be combined with other time-off (such as vacation days or sick leave) for extended breaks.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/chtd1Qgh08LRtQK-osiBl.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(3,'Early Leave Pass','1. Employees must request the Early Leave Pass from their immediate manager at least 24 hours in advance, unless it’s an urgent or emergency situation, in which case the manager should be notified as soon as possible.\n2. Early Leave is intended for single-day use and cannot be carried forward to the following days. It is a flexible, one-time benefit within the current workday.\n3. If early leave is granted, employees are expected to be available during core hours (10 AM to 3 PM) for any team-related meetings or business-critical tasks before taking leave.\n4. Employees are expected to ensure that leaving early does not negatively affect team collaboration, project deadlines, or urgent business requirements.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/s5vpNJCOfSwT51qi58ceC.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(4,'Late Start Pass','1. The Late Start Pass allows employees to begin their workday no later than 11 AM. Any start time beyond this must be discussed with the manager to ensure coverage and timely delivery of work.\n2. The Late Start Pass should not affect critical meetings, project deadlines, or essential team collaborations. Employees are responsible for ensuring their tasks and responsibilities are met despite the later start.\n3. Employees must notify their immediate team and manager in advance of their late start, especially if it may impact the flow of team communication or meetings scheduled earlier in the day.\n4. The Late Start Pass is for single-day use only and cannot be accumulated or carried forward to another day. It is to be utilized only on specific occasions when needed.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/5eEDcRinmfdZ-ydwTvraH.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(5,'One Day Leave Pass','1. Employees must request the One-Day Leave pass at least 24 hours in advance unless there are exceptional, unforeseen circumstances. This ensures that the leave is properly managed and does not disrupt the flow of work.\n2. Employees are required to inform their direct manager and relevant team members as soon as possible upon approval of the leave to ensure minimal disruption to projects, deadlines, or meetings.\n3. It is the responsibility of the employee to ensure that their workload is effectively managed and that any urgent tasks are delegated or completed prior to taking the leave. The One-Day Leave pass should not result in project delays or bottlenecks.\n4. The One-Day Leave pass is non-transferable.\n5. While no formal documentation is required for a single day of leave, employees are expected to ensure that their absence is communicated clearly and that any necessary handovers are completed to ensure smooth continuity of operations.\n6. Employees will receive full remuneration for the day taken off under the One-Day Leave pass, in line with their regular pay schedule.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/RxqYvvCi_S_8pWDaw8Vby.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(6,'Meeting Free Day','1. Employees must request the Meeting-Free Day at least 48 hours in advance through the appropriate internal platform or system. This ensures proper planning and avoids scheduling conflicts for critical meetings.\n2. Certain mandatory or critical meetings (e.g., client meetings, team check-ins, urgent crisis meetings) may be exempt from the Meeting-Free Day benefit.\n3. Employees are responsible for ensuring that any urgent meetings or discussions are either rescheduled or addressed before the designated Meeting-Free Day. Meeting-Free Days must be planned around critical deadlines and collaborative team activities.\n4. The Meeting-Free Day cannot be transferred to another employee or rolled over to the next quarter.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/Gj4wkg7sM3vPLesVXMznF.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(7,'Surprise Half Day','1. Half-Days are offered at the discretion of the management as a reward or motivational tool. Employees are not required to request or apply for this benefit.\n2. Employees will be notified of the Surprise Half-Day at least 2 hours before the end of the workday. This notice ensures that employees can plan their tasks accordingly, while also maintaining operational efficiency.\n3. Employees who are on leave, business travel, or critical assignments on the day of the surprise half-day will be excluded.\n4. Employees are free to leave after being notified, but must ensure that any necessary communications or immediate tasks are addressed before leaving.\n5. Employees should inform their colleagues and teams promptly upon receiving a Surprise Half-Day so that the workflow can be adjusted as needed.\n6. Employees will receive full remuneration for the day of the Surprise Half-Day, as it is considered part of the regular work schedule.\n7. The Surprise Half-Day will not be deducted from the employee’s annual leave balance. It is treated as an additional benefit provided by the company to encourage well-being.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/KKDD7fOPr2YKySK-TnabU.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22'),(8,'1-on-1 mentorship session with a Senior Executive','1. The session will be scheduled based on availability and priority.\n2. The pass holder should ensure they are punctual and prepared for the session to maximize its effectiveness.\n3. The pass holder should actively engage by asking relevant questions, sharing their experiences, and taking notes for future reference.','https://neure-staging.s3.ap-south-1.amazonaws.com/images/icons/YABd4gx1jAC7a6XJVa2e_.jpg','global','2025-02-26 07:52:09','2025-04-30 06:02:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soundscape_likes`
--

LOCK TABLES `soundscape_likes` WRITE;
/*!40000 ALTER TABLE `soundscape_likes` DISABLE KEYS */;
INSERT INTO `soundscape_likes` VALUES (18,110,31,'2025-04-24 07:04:29'),(20,109,30,'2025-04-24 07:17:27'),(21,109,32,'2025-04-24 07:17:28'),(23,110,30,'2025-04-24 07:24:00'),(24,109,31,'2025-04-24 07:24:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `soundscapes`
--

LOCK TABLES `soundscapes` WRITE;
/*!40000 ALTER TABLE `soundscapes` DISABLE KEYS */;
INSERT INTO `soundscapes` VALUES (23,'The Sound Of Life','Business Star','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/ZnUs7Haelb_ciVeVVJ4Rz.mp3',7066853,220.84,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/o2RWFydho9D-DJ-Xr0q5F.webp',1,'2025-04-03 06:21:03','2025-04-03 06:21:03','[\"Electronic\", \"Ambient\"]','mind'),(25,'Ocean Waves','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/utFJZqv1dh9SGIqbkYHyL.mp3',2278656,71.21,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/DU15wRTsp0qhaFa0kgvi5.jpg',1,'2025-04-14 06:14:42','2025-04-14 06:14:42','[\"Ocean, Waves\"]','mind'),(26,'Uplift','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/2n_nkEDCTf6KR5I2ffOCI.mp3',10067800,314.62,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/JGPqR4ym82gNBq5LqF4rV.jpg',1,'2025-04-14 06:16:30','2025-04-14 06:16:30','[\"Uplioft, Mind, Focus\"]','focus'),(27,'Zen Garden','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/S4tNfr2QsHOQIUXLytjIu.mp3',4233017,105.80,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/XOg4JvSB0CqaOuNCN-B2x.jpg',1,'2025-04-14 06:18:52','2025-04-14 06:18:52','[\"Garden, Relax\"]','focus'),(28,'Intersteller Jouney','Intersteller','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/MCL_QkTg62Y8Mue2ZQ9RM.mp3',4507814,112.67,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/RXxhuLONRTsCKoTmHq7d3.jpg',1,'2025-04-14 06:20:28','2025-04-14 06:20:28','[\"Intersteller, Space, focus\"]','focus'),(29,'Morning Garden','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/qDfNPkX2Yit6y8qoA8KO-.mp3',6815242,212.98,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/ylzkAthms3S4aTubjiQwr.jpg',1,'2025-04-14 06:24:34','2025-04-14 06:24:34','[\"Morning, yoga, focus\"]','relax'),(30,'Under Water','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/BMjQEJ3Rz6yNfaTOIqt76.mp3',2400960,120.05,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/VuWMV55kiRNh2SxypKs_X.jpg',1,'2025-04-14 06:26:29','2025-04-14 06:26:29','[\"Under water\", \"Ocean\", \"Sea\"]','relax'),(31,'Pure Focus','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/L5R5V332ekXjq0qi4kT8f.mp3',3007603,187.69,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/7_LvZwZ0ML9ypBs-mI9m2.jpg',1,'2025-04-14 06:27:46','2025-04-14 06:27:46','[\"Focus\", \"Relax\", \"Memory\"]','mind'),(32,'Unwind','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/XA0-mZRvF471JmKCTIwGt.mp3',18490514,577.83,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/WoWQtV4LogvCrMPC_qtM0.jpg',1,'2025-04-14 06:28:55','2025-04-14 06:28:55','[\"Mind\", \"Relax\", \"Focus\"]','mind'),(33,'Enchanted Forest','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/k8Vmby09fZmOaLmdYPM_X.mp3',7611872,237.87,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/zFzuGNqObRyOx3TAV5f_m.jpg',1,'2025-04-14 06:30:04','2025-04-14 06:30:04','[\"Forest\"]','mind'),(34,'Enchanted Forest','Neure','https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/-UAOFzj9VztdwxKKoMzn1.mp3',7611872,237.87,'https://neure-staging.s3.ap-south-1.amazonaws.com/sounds/therapy/covers/w5lJTE1TOl-RNLcsizWsR.jpg',1,'2025-04-14 06:30:05','2025-04-14 06:30:05','[\"Forest\"]','mind');
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_assessment_id` (`user_assessment_id`),
  KEY `idx_question_id` (`question_id`),
  CONSTRAINT `fk_user_assessment_responses_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_assessment_responses_user_assessment` FOREIGN KEY (`user_assessment_id`) REFERENCES `user_assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_assessment_responses`
--

LOCK TABLES `user_assessment_responses` WRITE;
/*!40000 ALTER TABLE `user_assessment_responses` DISABLE KEYS */;
INSERT INTO `user_assessment_responses` VALUES (35,32,11,'[28]',1,'2025-05-06 07:42:44'),(36,32,12,'[32]',1,'2025-05-06 07:42:44'),(37,32,13,'[36]',1,'2025-05-06 07:42:44'),(38,32,14,'[40]',1,'2025-05-06 07:42:44'),(39,32,15,'[45]',0,'2025-05-06 07:42:44'),(40,32,16,'[48]',1,'2025-05-06 07:42:44'),(41,33,17,'[53]',0,'2025-05-06 07:46:54'),(42,33,18,'[57]',0,'2025-05-06 07:46:54'),(43,33,19,'[61]',0,'2025-05-06 07:46:54'),(44,33,20,'[64]',0,'2025-05-06 07:46:54'),(45,33,21,'[69]',0,'2025-05-06 07:46:54'),(46,33,22,'[72]',0,'2025-05-06 07:46:54');
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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `assessment_id` (`assessment_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `user_assessments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_assessments_ibfk_2` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_assessments_ibfk_3` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_assessments`
--

LOCK TABLES `user_assessments` WRITE;
/*!40000 ALTER TABLE `user_assessments` DISABLE KEYS */;
INSERT INTO `user_assessments` VALUES (31,1,110,11,'2025-05-06 07:40:25','[]',0),(32,1,110,7,'2025-05-06 07:42:44','[{\"question_id\": 11, \"selected_options\": [28]}, {\"question_id\": 12, \"selected_options\": [32]}, {\"question_id\": 13, \"selected_options\": [36]}, {\"question_id\": 14, \"selected_options\": [40]}, {\"question_id\": 15, \"selected_options\": [45]}, {\"question_id\": 16, \"selected_options\": [48]}]',83.3333),(33,1,110,8,'2025-05-06 07:46:54','[{\"question_id\": 17, \"selected_options\": [53]}, {\"question_id\": 18, \"selected_options\": [57]}, {\"question_id\": 19, \"selected_options\": [61]}, {\"question_id\": 20, \"selected_options\": [64]}, {\"question_id\": 21, \"selected_options\": [69]}, {\"question_id\": 22, \"selected_options\": [72]}]',0);
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
INSERT INTO `user_departments` VALUES (2,5,'2025-01-17 12:18:12'),(103,4,'2025-04-18 10:22:01'),(104,3,'2025-04-18 10:22:01'),(105,2,'2025-04-18 10:22:02'),(106,1,'2025-04-18 10:22:02'),(107,5,'2025-04-18 10:22:02'),(110,1,'2025-04-21 06:28:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_resource_tracking`
--

LOCK TABLES `user_resource_tracking` WRITE;
/*!40000 ALTER TABLE `user_resource_tracking` DISABLE KEYS */;
INSERT INTO `user_resource_tracking` VALUES (6,2,'gallery_document',4,'view','2025-04-18 08:35:18'),(7,2,'gallery_image',9,'view','2025-04-18 08:35:59'),(8,2,'gallery_image',9,'view','2025-04-21 10:01:17'),(9,110,'gallery_image',9,'view','2025-04-21 10:05:58'),(10,110,'gallery_image',10,'view','2025-04-21 10:06:04'),(11,110,'gallery_document',4,'view','2025-04-21 10:06:08'),(12,110,'gallery_document',4,'view','2025-04-21 10:06:16'),(13,110,'gallery_video',24,'view','2025-04-21 10:06:26'),(14,110,'gallery_video',22,'view','2025-04-21 10:06:30'),(15,110,'gallery_image',10,'view','2025-04-21 10:07:40'),(16,110,'gallery_image',9,'view','2025-04-21 10:11:27'),(17,110,'gallery_image',10,'view','2025-04-21 10:11:31'),(18,110,'gallery_image',10,'view','2025-04-21 10:20:05'),(19,110,'gallery_image',10,'view','2025-04-29 05:23:57'),(20,110,'gallery_video',24,'view','2025-04-29 05:23:57'),(21,110,'gallery_video',24,'view','2025-04-29 05:23:58'),(22,110,'gallery_video',24,'view','2025-04-29 05:24:01'),(23,110,'gallery_video',24,'view','2025-04-29 05:24:02'),(24,110,'gallery_document',4,'view','2025-04-29 05:24:08'),(25,110,'gallery_image',10,'view','2025-05-06 11:26:50'),(26,110,'gallery_video',24,'view','2025-05-06 11:28:30'),(27,110,'gallery_video',24,'view','2025-05-06 11:28:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_subscriptions`
--

LOCK TABLES `user_subscriptions` WRITE;
/*!40000 ALTER TABLE `user_subscriptions` DISABLE KEYS */;
INSERT INTO `user_subscriptions` VALUES (3,2,0,0,1,1,'2025-03-13 10:55:07','2025-04-18 06:10:12'),(5,103,1,1,1,1,'2025-04-18 10:22:01','2025-04-18 10:22:01'),(6,104,1,1,1,1,'2025-04-18 10:22:01','2025-04-18 10:22:01'),(7,105,1,1,1,1,'2025-04-18 10:22:02','2025-04-18 10:22:02'),(8,106,1,1,1,1,'2025-04-18 10:22:02','2025-04-18 10:22:02'),(9,107,1,1,1,1,'2025-04-18 10:22:02','2025-04-18 10:22:02'),(10,109,1,1,1,1,'2025-04-21 06:26:29','2025-04-21 06:26:29'),(11,110,0,0,1,1,'2025-04-21 06:28:48','2025-04-22 11:06:28'),(12,111,1,1,1,1,'2025-04-22 05:40:50','2025-04-22 05:40:50'),(20,125,1,1,1,1,'2025-05-05 10:03:44','2025-05-05 10:03:44');
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
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'abc@gmail.com','8520741022','$2b$10$rPVN5vgwmTWnj1.ee92/vO.WpmSEhaSFlVXK1PTMosRXzDcYDK6im','Chandan','Chandan','Yadav','other','Thane, kalwa','2000-01-06',25,'https://neure-staging.s3.ap-south-1.amazonaws.com/images/profiles/users/Gc_F91wMja17Rcq0iBWTO.jpg',14,10,92,1,NULL,3,1,'2025-04-25 12:24:37',NULL,1,'2025-01-08 10:41:12','2025-04-30 18:31:02'),(4,'supadmin@gmail.com','7894561230','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','Chandan','Chandan','Yadav','other','Thane','2001-05-28',24,NULL,0,0,0,0,NULL,1,1,'2025-05-07 06:28:59',NULL,0,'2025-03-21 07:10:47','2025-05-07 06:28:59'),(103,'prem@gmail.com','1234567890','$2b$10$jUJ2AIOlSfqLbwo5rzt3iuS5xK4TlJGBAQKnNMko1CYnXCmryHRdi','prem.chopra','Prem','Chopra','male','Thane','2025-04-15',0,NULL,0,0,0,0,NULL,3,1,'2025-04-29 06:56:21',NULL,0,'2025-04-18 10:22:01','2025-04-29 06:57:17'),(104,'radha@gmail.com','9876543210','$2b$10$6X84JqH4EJzInDwV6aCQietvcIDvMEpxno5WcTJfHA1K9FnbuhACm','radha.kapoor','Radha','Kapoor','female','Mumbai','1990-06-10',34,NULL,0,0,0,0,'Designer',3,1,NULL,NULL,0,'2025-04-18 10:22:01','2025-04-18 10:22:01'),(105,'amit@gmail.com','1231231231','$2b$10$RQXLYZfdKQWUtTkfvhH5jO9cODG3zpF38fk.AQUZ1dmJf31OZJku2','amit.verma','Amit','Verma','male','Pune','1988-12-22',36,NULL,0,0,0,0,'Engineer',3,1,NULL,NULL,0,'2025-04-18 10:22:01','2025-04-18 10:22:01'),(106,'sneha@gmail.com','9090909090','$2b$10$AtXDVmWU68.yPtjYQL/QXu5JSI6WUo72d/0UYAkCjg2LPTfBhJLMC','sneha.singh','Sneha','Singh','female','Nashik','1995-08-05',29,NULL,0,0,0,0,'Manager',3,1,NULL,NULL,0,'2025-04-18 10:22:02','2025-04-18 10:22:02'),(107,'rahul@gmail.com','8080808080','$2b$10$5lLyt0BltLWk.drKkHQYYuJlnKF7ZY81Vo7eDaNs.aywlYw1HvWdK','rahul.jain','Rahul','Jain','male','Nagpur','1992-03-17',33,NULL,0,0,0,0,'Analyst',3,1,NULL,NULL,0,'2025-04-18 10:22:02','2025-04-18 10:22:02'),(109,'neure@gmail.com','8454883225','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','chandanyadav1','Chandan','Jadhav','male',NULL,NULL,NULL,NULL,0,0,0,1,'SDE-1',2,1,'2025-05-06 09:52:23',NULL,1,'2025-04-19 21:26:29','2025-05-06 09:52:23'),(110,'ricky@gmail.com','1122344556','$2b$10$9tmvEUvsKIiNzYBhABJDMufLzwyvVaerXGcaXH3ftw8DlzvkFl9zC','rickjoy','Rick','harry','male','','2025-04-10',0,NULL,0,0,0,1,'IDK',3,1,'2025-05-06 11:26:30','2025-05-05 05:35:59',1,'2025-04-21 06:28:48','2025-05-06 11:26:30'),(111,'varun@neure.co.in','8850352266','$2b$10$zzrbfoRKdtEPy/58GGJehuVzGSa8fNdUPEpugtnZiO12BY/7JP0BS','varunpatel','Varun','Patel','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-04-22 05:40:50','2025-04-22 05:40:50'),(125,'joh@gmail.com','1515115151','$2b$10$YXdhfb1hOpDYmf7gIpykpOrkfNsVR.fc3IqstsR0LaYw5OmGNKsDu','johnvic','John','Vic','male',NULL,NULL,NULL,NULL,0,0,0,0,NULL,2,1,NULL,NULL,0,'2025-05-05 10:03:44','2025-05-05 10:03:44');
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
  `start_time` timestamp NOT NULL,
  `end_time` timestamp NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `status` enum('scheduled','cancelled','completed','rescheduled') DEFAULT 'scheduled',
  `max_participants` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workshop_id` (`workshop_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `workshop_schedules_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workshop_schedules_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshop_schedules`
--

LOCK TABLES `workshop_schedules` WRITE;
/*!40000 ALTER TABLE `workshop_schedules` DISABLE KEYS */;
INSERT INTO `workshop_schedules` VALUES (55,17,23,'2025-05-06 03:00:00','2025-06-22 07:00:00',240,'scheduled',NULL,'2025-05-06 09:39:20'),(57,29,23,'2025-05-06 03:00:00','2025-06-07 07:11:00',179,'scheduled',NULL,'2025-05-06 09:39:20'),(58,29,23,'2025-05-22 06:00:00','0000-00-00 00:00:00',NULL,'scheduled',NULL,'2025-05-02 08:47:23'),(59,20,24,'2026-04-08 05:00:00','2026-04-08 06:00:00',60,'scheduled',NULL,'2025-05-02 08:47:23'),(60,29,6,'2025-05-01 02:00:00','2025-05-01 04:00:00',120,'completed',NULL,'2025-05-05 10:00:53'),(61,22,25,'2025-05-10 13:57:56','2025-05-10 14:41:56',44,'scheduled',NULL,'2025-05-06 08:28:04');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_code` (`ticket_code`),
  KEY `user_id` (`user_id`),
  KEY `idx_ticket_code` (`ticket_code`),
  KEY `idx_workshop_user` (`workshop_id`,`user_id`),
  KEY `fk_workshop_company` (`company_id`),
  CONSTRAINT `fk_workshop_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `workshop_tickets_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workshop_tickets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshop_tickets`
--

LOCK TABLES `workshop_tickets` WRITE;
/*!40000 ALTER TABLE `workshop_tickets` DISABLE KEYS */;
INSERT INTO `workshop_tickets` VALUES (34,17,110,23,'NEUH32N0YF',1,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruitwala/Unleash your superhero/Rick_Joy_NEUH32N0YF.pdf','2025-04-23 13:30:42','2025-05-06 10:04:56'),(35,17,109,23,'NEUH31NJQH',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruitwala/Unleash your superhero/Chandan_Yadav_NEUH31NJQH.pdf','2025-04-23 13:30:42','2025-04-23 13:30:42'),(38,29,110,23,'NEUT32TTKE',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Rick_harry_NEUT32TTKE.pdf','2025-04-30 11:46:31','2025-04-30 11:46:31'),(39,29,109,23,'NEUT31JJZI',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Chandan_Jadhav_NEUT31JJZI.pdf','2025-04-30 11:46:31','2025-04-30 11:46:31'),(40,29,110,23,'NEUT32XQJ0',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Rick_harry_NEUT32XQJ0.pdf','2025-04-30 11:56:47','2025-04-30 11:56:47'),(41,29,109,23,'NEUT31EMJV',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/TheFruit/rioritizing Mental Health in the Workplace/Chandan_Jadhav_NEUT31EMJV.pdf','2025-04-30 11:56:47','2025-04-30 11:56:47'),(42,20,111,24,'NEUK33RESG',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Neure/Unleash your superhero/Varun_Patel_NEUK33RESG.pdf','2025-04-30 12:01:54','2025-04-30 12:01:54'),(43,29,103,6,'NEUT2VF30Z',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Tech Solutions/rioritizing Mental Health in the Workplace/Prem_Chopra_NEUT2VF30Z.pdf','2025-05-02 09:19:42','2025-05-02 09:19:42'),(44,29,105,6,'NEUT2X-ZVF',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Tech Solutions/rioritizing Mental Health in the Workplace/Amit_Verma_NEUT2X-ZVF.pdf','2025-05-02 09:19:42','2025-05-02 09:19:42'),(45,29,104,6,'NEUT2WWK7B',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Tech Solutions/rioritizing Mental Health in the Workplace/Radha_Kapoor_NEUT2WWK7B.pdf','2025-05-02 09:19:42','2025-05-02 09:19:42'),(46,29,107,6,'NEUT2ZWQMB',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Tech Solutions/rioritizing Mental Health in the Workplace/Rahul_Jain_NEUT2ZWQMB.pdf','2025-05-02 09:19:42','2025-05-02 09:19:42'),(47,29,106,6,'NEUT2Y1IPD',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Tech Solutions/rioritizing Mental Health in the Workplace/Sneha_Singh_NEUT2Y1IPD.pdf','2025-05-02 09:19:42','2025-05-02 09:19:42'),(48,22,125,25,'NEUM3HPTOH',0,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/Technova/Unleash your superhero/John_Vic_NEUM3HPTOH.pdf','2025-05-06 08:28:05','2025-05-06 08:28:05');
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
  `organizer` varchar(255) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workshops`
--

LOCK TABLES `workshops` WRITE;
/*!40000 ALTER TABLE `workshops` DISABLE KEYS */;
INSERT INTO `workshops` VALUES (17,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/17/cover/GdAKcnfKf2xkDIVBUW2B8.png','https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/17/files/lTeRrtlLumIiJGkZXo8J3.pdf',0.00,0,0,NULL,1,'2025-04-22 05:22:51','2025-04-30 11:35:35'),(18,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:53','2025-04-22 05:22:53'),(19,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:55','2025-04-22 05:22:55'),(20,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:56','2025-04-22 05:22:56'),(21,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:22:57','2025-04-22 05:22:57'),(22,'Unleash your superhero','abcd 123','abcd 123',NULL,NULL,'Pujita Mirwani',NULL,NULL,NULL,0.00,0,0,NULL,1,'2025-04-22 05:23:27','2025-04-22 05:23:27'),(25,'Hello','fghvbjknm,','wdefrvd',NULL,NULL,'ME',NULL,NULL,NULL,0.00,0,0,NULL,0,'2025-04-30 10:15:05','2025-04-30 10:36:11'),(26,'Hello','fghvbjknm,','wdefrvd',NULL,NULL,'ME',NULL,NULL,NULL,0.00,0,0,NULL,0,'2025-04-30 10:17:27','2025-04-30 10:35:36'),(29,'rioritizing Mental Health in the Workplace','Join us for an insightful session focused on understanding, managing, and supporting mental health in professional environments. In today\'s fast-paced work culture, mental well-being is just as important as physical health. This event aims to create awareness, reduce stigma, and provide actionable tools to support yourself and your colleagues.','Welcome & Opening Remarks (5 mins)\n\nUnderstanding Mental Health – Common stressors, signs & symptoms (15 mins)\n\nInteractive Activity: Self-Check Exercise (10 mins)\n\nBuilding a Culture of Psychological Safety at Work (15 mins)\n\nMindfulness & Stress-Relief Techniques (10 mins)\n\nQ&A Session / Open Discussion (10 mins)\n\nClosing Notes & Resources for Support (5 mins)',NULL,NULL,'Pravven Sonesha',NULL,'https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/29/cover/S4jJsaDeTMhBDJ6wcrQXN.png','https://neure-staging.s3.ap-south-1.amazonaws.com/workshops/29/files/QsRLbQfltIU1-wpSzaG5K.pdf',0.00,0,0,NULL,1,'2025-04-30 11:14:50','2025-04-30 11:14:51');
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

-- Dump completed on 2025-05-07 12:50:39
