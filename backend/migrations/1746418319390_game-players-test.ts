import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable("game-players-test", {
        id: "id",
        game_id: {
            type: 'integer',
            notNull: true,
            references: '"games-test"',
            onDelete: 'CASCADE',
        },
        player_id: {
            type: 'integer',
            notNull: true,
            references: '"usertest"',
            onDelete: 'CASCADE',
        },
        seat: {
            type: 'serial',
            notNull: true,
        },
        is_current: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        is_host: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
    });
    
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('game-players-test');
}
