import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable("games-test", {
        id: "id",
        name: {
            type: 'varchar(255)',
        },
        min_players: {
            type: 'integer',
            notNull: true,
            default: 2,
        },
        max_players: {
            type: 'integer',
            notNull: true,
            default: 6,
        },
         password: {
            type: 'varchar(255)',
        },
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('games-test');
}
