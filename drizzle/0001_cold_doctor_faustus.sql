CREATE TABLE `quiz_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`score` int NOT NULL,
	`readinessLevel` varchar(50) NOT NULL,
	`answers` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('new','contacted','converted','archived') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_submissions_id` PRIMARY KEY(`id`)
);
