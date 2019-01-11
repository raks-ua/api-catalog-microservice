CREATE TABLE `[SERVICE_APP_NAME]_catalog_key` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(1024) NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `[SERVICE_APP_NAME]_catalog_key`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_uniq` (`name`);

ALTER TABLE `[SERVICE_APP_NAME]_catalog_key`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

