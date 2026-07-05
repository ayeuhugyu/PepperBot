import { ActionRow, Button, ButtonStyle, Container, Section, Separator, TextDisplay } from "../../../lib/classes/components";
import * as action from "../../../lib/discord_action";
import { AnyPrompt } from "../../../lib/gpt/promptManager";
import database from "../../../lib/data_manager";

export async function refreshMainPromptEmbed(prompt: AnyPrompt, disabled: boolean = false) {
    let isDefault = false;
    if ((await database("prompt_defaults").where({ user_id: prompt.author.id }).first())?.prompt_name == prompt.name) {
        isDefault = true;
    }

    const components: action.TopLevelComponent[] = [
        new Container({
            components: [
                new Section({
                    components: [
                        new TextDisplay({
                            content: `## editing prompt \`${prompt.name}\`\n`
                        })
                    ],
                    accessory: new Button({
                        style: ButtonStyle.Secondary,
                        label: "create new prompt",
                        custom_id: "createNewPrompt",
                        disabled,
                    })
                }),
                new Separator(),
                new Section({
                    components: [
                        new TextDisplay({
                            content: `### __content__:`,
                        }),
                    ],
                    accessory: new Button({
                        style: ButtonStyle.Primary,
                        label: "edit content",
                        custom_id: "editContent",
                        disabled,
                    }),
                }),
                new TextDisplay({
                    content: `\n${action.fixMessage({ content: prompt.content.slice(0, 1000), allowOverflow: true }).content!}${(prompt.content.length > 1000) ? "... \n(cut due to length)" : ""}\n`
                }),
                new Separator(),
                new ActionRow({
                    components: [
                        new Button({
                            style: isDefault ? ButtonStyle.Success : ButtonStyle.Danger,
                            label: isDefault ? "revert default" : "make default",
                            custom_id: "toggleIsDefault",
                            disabled,
                        }),
                        new Button({
                            style: ButtonStyle.Secondary,
                            label: "set as active prompt",
                            custom_id: "setAsActivePrompt",
                            disabled,
                        }),
                        new Button({
                            style: ButtonStyle.Danger,
                            label: "delete prompt",
                            custom_id: "deletePrompt1",
                            disabled,
                        }),
                    ]
                }),
                new ActionRow({
                    components: [
                        new Button({
                            style: ButtonStyle.Primary,
                            label: "configure parameters",
                            custom_id: "startConfiguringParameters",
                            disabled,
                        }),
                        new Button({
                            style: ButtonStyle.Secondary,
                            label: "configure tools",
                            custom_id: "startConfiguringTools",
                            disabled,
                        }),
                        new Button({
                            style: ButtonStyle.Success,
                            label: "change model",
                            custom_id: "startConfiguringModel",
                            disabled,
                        }),
                    ]
                }),
            ]
        })
    ];

    return components;
}