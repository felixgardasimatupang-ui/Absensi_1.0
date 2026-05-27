CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkInTime` datetime,
	`checkOutTime` datetime,
	`checkInLatitude` decimal(10,8),
	`checkInLongitude` decimal(11,8),
	`checkOutLatitude` decimal(10,8),
	`checkOutLongitude` decimal(11,8),
	`checkInPhotoUrl` text,
	`checkOutPhotoUrl` text,
	`workHours` decimal(5,2),
	`status` enum('present','absent','late','half-day') NOT NULL DEFAULT 'present',
	`notes` text,
	`attendanceDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendanceSummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`summaryDate` datetime NOT NULL,
	`totalPresent` int DEFAULT 0,
	`totalAbsent` int DEFAULT 0,
	`totalLate` int DEFAULT 0,
	`totalLeave` int DEFAULT 0,
	`totalWorkHours` decimal(8,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceSummary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leaveType` enum('annual','sick','personal','permission') NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `position` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoUrl` text;