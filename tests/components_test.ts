import { Button, ButtonStyle, Container, Section, Separator, TextDisplay } from "../src/lib/classes/components";

const messageComponents = [
    new Container({
        components: [
            new Section({
                components: [
                    new TextDisplay({ content: "hiiii" }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Danger,
                    label: "DEATH",
                    custom_id: "death_button"
                })
            }),
            new Separator(),
            new Section({
                components: [
                    new TextDisplay({ content: "im gonna MURDER you." }),
                ],
                accessory: new Button({
                    style: ButtonStyle.Success,
                    label: "Happiness",
                    custom_id: "happiness_button"
                })
            }),
        ]
    })
];