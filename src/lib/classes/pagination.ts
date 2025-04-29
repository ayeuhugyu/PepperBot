import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, InteractionResponse } from 'discord.js';
import * as log from "../log"
import { randomUUIDv7 } from 'bun';

class PagedMenu {
    embeds: EmbedBuilder[];
    currentPage: number;
    activeMessage: Message | null;
    ended: boolean = false;
    private id: string;

    constructor(embeds: EmbedBuilder[]) {
        this.embeds = embeds;
        this.currentPage = 0;
        this.activeMessage = null;
        this.id = randomUUIDv7();
        log.debug(`initialized PagedMenu with ${embeds.length} embeds and id ${this.id}`);
    }

    getActionRow(): ActionRowBuilder<ButtonBuilder> {
        log.debug(`fetched${this.ended ? " disabled" : ""} action row for PagedMenu ${this.id}`);
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
                    .setDisabled(this.currentPage === this.embeds.length - 1)
            );
    }

    public async setActiveMessage(message: Message): Promise<void> {
        this.activeMessage = message;
        await this.updateMessage();

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600_000 });

        collector.on('collect', async (interaction: Interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'previous' && this.currentPage > 0) {
                this.currentPage--;
            } else if (interaction.customId === 'next' && this.currentPage < this.embeds.length - 1) {
                this.currentPage++;
            }

            await this.updateMessage();
            await interaction.deferUpdate();
        });

        collector.on('end', () => {
            if (this.activeMessage) {
                log.debug(`disabling  PagedMenu on page ${this.currentPage} with id ${this.id}`);
                this.ended = true;
                this.updateMessage()
            }
        });
    }

    private async updateMessage(): Promise<void> {
        log.debug(`updating message for PagedMenu with id ${this.id} to page ${this.currentPage}`);
        if (this.activeMessage) {
            await this.activeMessage.edit({
                embeds: [this.embeds[this.currentPage]],
                components: [this.getActionRow()]
            });
        }
    }
}

export default PagedMenu;