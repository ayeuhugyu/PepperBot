import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, InteractionResponse, JSONEncodable, APIActionRowComponent, ActionRowData, MessageActionRowComponent, MessageActionRowComponentData, MessageActionRowComponentBuilder, MessageFlags } from 'discord.js';
import * as action from "../discord_action";
import * as log from "../log";
import { randomUUIDv7 } from 'bun';

class V2PagedMenu {
    pages: NonNullable<action.MessageInput['components']>[];
    currentPage: number;
    activeMessage: Message | null;
    ended: boolean = false;
    collector: any;
    private id: string;

    constructor(pages: typeof this.pages) {
        this.pages = pages;
        this.currentPage = 0;
        this.activeMessage = null;
        this.id = randomUUIDv7();
        log.debug(`initialized V2PagedMenu with ${pages.length} pages and id ${this.id}`);
    }

    onPageChange(page: number): void {
        log.debug(`page changed to ${page} for V2PagedMenu ${this.id}`);
    } // this is here so that it can be overridden


    getActionRow(): ActionRowBuilder<ButtonBuilder> {
        log.debug(`fetched${this.ended ? " disabled" : ""} action row for V2PagedMenu ${this.id}`);
        if (this.ended) {
            return new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
        }
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(this.currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(this.currentPage === this.pages!.length - 1)
            );
    }

    public async setActiveMessage(message: Message): Promise<void> {
        this.activeMessage = message;
        await this.updateMessage();

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000 });
        this.collector = collector;

        collector.on('collect', async (interaction: Interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'previous' && this.currentPage > 0) {
                this.currentPage--;
            } else if (interaction.customId === 'next' && this.currentPage < this.pages!.length - 1) {
                this.currentPage++;
            }
            this.onPageChange(this.currentPage);

            await this.updateMessage();
            await interaction.deferUpdate();
        });

        collector.on('end', () => {
            if (this.activeMessage) {
                log.debug(`disabling  V2PagedMenu on page ${this.currentPage} with id ${this.id}`);
                this.ended = true;
                this.updateMessage()
            }
        });
    }

    private async updateMessage(): Promise<void> {
        log.debug(`updating message for V2PagedMenu on page ${this.currentPage} with id ${this.id}`);
        if (this.activeMessage) {
            await action.edit(this.activeMessage, {
                components: [...this.pages![this.currentPage], this.getActionRow()],
                flags: (this.activeMessage.flags?.bitfield ?? 0) | MessageFlags.IsComponentsV2,
            });
        }
    }

    stop(): void {
        this.collector.stop();
    }
}

export default V2PagedMenu;