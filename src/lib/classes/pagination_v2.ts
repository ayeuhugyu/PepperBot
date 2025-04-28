import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, InteractionResponse, JSONEncodable, APIActionRowComponent, ActionRowData, MessageActionRowComponent, MessageActionRowComponentData, MessageActionRowComponentBuilder, MessageFlags } from 'discord.js';


class V2PagedMenu {
    pages: (JSONEncodable<APIActionRowComponent<any>> | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder> | APIActionRowComponent<any>)[];
    currentPage: number;
    activeMessage: Message | null;

    constructor(pages: typeof this.pages) {
        this.pages = pages;
        this.currentPage = 0;
        this.activeMessage = null;
    }

    getActionRow(): ActionRowBuilder<ButtonBuilder> {
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
                    .setDisabled(this.currentPage === this.pages.length - 1)
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
            } else if (interaction.customId === 'next' && this.currentPage < this.pages.length - 1) {
                this.currentPage++;
            }

            await this.updateMessage();
            await interaction.deferUpdate();
        });

        collector.on('end', () => {
            if (this.activeMessage) {
                this.activeMessage.edit({ components: [] });
            }
        });
    }

    private async updateMessage(): Promise<void> {
        if (this.activeMessage) {
            await this.activeMessage.edit({
                components: [this.pages[this.currentPage], this.getActionRow()],
                flags: (this.activeMessage.flags?.bitfield ?? 0) | MessageFlags.IsComponentsV2,
            });
        }
    }
}

export default V2PagedMenu;