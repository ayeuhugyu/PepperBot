import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, InteractionResponse, JSONEncodable, APIActionRowComponent, ActionRowData, MessageActionRowComponent, MessageActionRowComponentData, MessageActionRowComponentBuilder, MessageFlags } from 'discord.js';
import * as action from "../discord_action";
import * as log from "../log";
import { randomId } from '../id';

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
        this.id = randomId();
        log.info(`initialized V2PagedMenu with ${pages.length} pages and id ${this.id}`);
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
                        .setCustomId('pagination_previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('pagination_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
        }
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pagination_previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(this.currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('pagination_next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(this.currentPage === this.pages!.length - 1)
            );
    }

    public async setActiveMessage(message: Message): Promise<void> {
        this.activeMessage = message;
        await this.updateMessage();

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000, filter: (i) => i.customId.startsWith('pagination_') });
        this.collector = collector;

        collector.on('collect', async (interaction: Interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'pagination_previous' && this.currentPage > 0) {
                this.currentPage--;
            } else if (interaction.customId === 'pagination_next' && this.currentPage < this.pages!.length - 1) {
                this.currentPage++;
            }
            this.onPageChange(this.currentPage);

            await this.updateMessage();
            await interaction.deferUpdate();
        });

        collector.on('end', () => {
            if (this.activeMessage) {
                log.info(`disabling  V2PagedMenu on page ${this.currentPage} with id ${this.id}`);
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
        // i dont care if this causes a very slight fucking issue with having 500 collectors lying around i just dont give a fuck
        if (this && this.collector) {
            this.collector.stop();
        }
    }
}

export default V2PagedMenu;