import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1759592288528 implements MigrationInterface {
    name = 'Migration1759592288528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`queue_processing_log\` (\`id\` int NOT NULL AUTO_INCREMENT, \`message_id\` varchar(255) NOT NULL, \`queue_name\` varchar(100) NOT NULL, \`payload\` json NULL, \`status\` enum ('PROCESSING', 'COMPLETED', 'FAILED', 'RETRY') NOT NULL DEFAULT 'PROCESSING', \`retry_count\` int NOT NULL DEFAULT '0', \`max_retries\` int NOT NULL DEFAULT '3', \`error_message\` text NULL, \`processed_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_a5f48e45a89ab1d00bf190b502\` (\`created_at\`), INDEX \`IDX_a071981736f2b95a9b61ae2730\` (\`status\`), UNIQUE INDEX \`IDX_e93350a8c6ff99b5ed081cfaf7\` (\`message_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_52b4b7c7d295e204add6dbe0a09\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employees\` ADD CONSTRAINT \`FK_678a3540f843823784b0fe4a4f2\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employees\` DROP FOREIGN KEY \`FK_678a3540f843823784b0fe4a4f2\``);
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_52b4b7c7d295e204add6dbe0a09\``);
        await queryRunner.query(`DROP INDEX \`IDX_e93350a8c6ff99b5ed081cfaf7\` ON \`queue_processing_log\``);
        await queryRunner.query(`DROP INDEX \`IDX_a071981736f2b95a9b61ae2730\` ON \`queue_processing_log\``);
        await queryRunner.query(`DROP INDEX \`IDX_a5f48e45a89ab1d00bf190b502\` ON \`queue_processing_log\``);
        await queryRunner.query(`DROP TABLE \`queue_processing_log\``);
    }

}
