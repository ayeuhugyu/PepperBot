import { ChannelType } from "discord.js";

export enum ComponentType {
    ActionRow = 1,
    Button = 2,
    StringSelect = 3,
    TextInput = 4,
    UserSelect = 5,
    RoleSelect = 6,
    MentionableSelect = 7,
    ChannelSelect = 8,
    Section = 9,
    TextDisplay = 10,
    Thumbnail = 11,
    MediaGallery = 12,
    File = 13,
    Separator = 14,
    // unused = 15
    // unused = 16,
    Container = 17
}

export type AnyComponent = ActionRow | Button<any> | StringSelect | TextInput | UserSelect | RoleSelect | MentionableSelect | ChannelSelect | Section | TextDisplay | Thumbnail | MediaGallery | File | Separator;
export type ActionRowComponent = Button<any> | StringSelect | TextInput | UserSelect | RoleSelect | MentionableSelect | ChannelSelect
export type ContainerComponent = ActionRow | TextDisplay | Section | MediaGallery | Separator | File

/**
 * An Action Row is a top-level layout component used in messages and modals.
 *
 * Action rows can contain:
 * - Up to 5 contextually grouped `Button` components
 * - A single `TextInput` component
 * - A single select component (`StringSelect`, `UserSelect`, `RoleSelect`, `MentionableSelect`, or `ChannelSelect`)
 *
 * @property id - An optional identifier for the action row.
 * @property components - An array of components to be displayed in the action row.
 */
export class ActionRow {
    type: ComponentType.ActionRow = ComponentType.ActionRow;
    id?: number;

    components: AnyComponent[];

    constructor(args: Omit<ActionRow, 'type'>) {
        this.type = ComponentType.ActionRow;
        this.components = args.components;
        this.id = args.id;
    }
}

export enum ButtonStyle {
    Primary = 1,
    Secondary = 2,
    Success = 3,
    Danger = 4,
    Link = 5,
    Premium = 6,
}

/**
 * A Button is an interactive component that can only be used in messages.
 * Buttons must be placed inside an `ActionRow` or a `Section`'s `accessory` field.
 *
 * @property id - An optional identifier for the button.
 * @property style - The style of the button, which determines its appearance and behavior.
 * @property custom_id - A unique identifier for the button, used to identify which button was clicked.
 * @property url - The URL to open when the button is clicked, only applicable for `Link` buttons.
 * @property sku_id - The SKU ID for the button, only applicable for `Premium` buttons.
 * @property label - The text displayed on the button.
 * @property emoji - An optional emoji to display on the button.
 * @property disabled - A boolean indicating whether the button is disabled or not.
 */
export class Button<S extends ButtonStyle> {
    type: ComponentType.Button = ComponentType.Button;
    id?: number;

    style: ButtonStyle = ButtonStyle.Primary;
    custom_id: S extends ButtonStyle.Link | ButtonStyle.Premium ? never : string;
    url?: S extends ButtonStyle.Link ? string : never;
    sku_id?: S extends ButtonStyle.Premium ? string : never;

    label?: string;
    emoji?: string;
    disabled?: boolean;

    constructor(args: Omit<Button<S>, 'type'>) {
        this.type = ComponentType.Button;
        this.style = args.style;
        switch (args.style) {
            case ButtonStyle.Link:
                this.url = args.url;
                break;
            case ButtonStyle.Premium:
                this.sku_id = args.sku_id;
                break;
        }
        this.custom_id = args.custom_id;
        this.label = args.label;
        this.emoji = args.emoji;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

export class StringSelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;

    constructor(args: StringSelectOption) {
        this.label = args.label;
        this.value = args.value;
        this.description = args.description;
        this.emoji = args.emoji;
        this.default = args.default;
    }
}

/**
 * A String Select is an interactive component that allows users to select one or more provided `StringSelectOption`s in a message.
 *
 * String Selects must be placed inside an Action Row and are only available in messages.
 * An Action Row can contain only one select menu and cannot contain buttons if it has a select menu.
 *
 * @property id - An optional identifier for the select menu.
 * @property custom_id - A unique identifier for the select menu, used to distinguish it from others in interaction responses.
 * @property options - An array of `StringSelectOption`s to be displayed in the select menu.
 * @property placeholder - An optional placeholder text to display when no option is selected.
 * @property min_values - The minimum number of options that can be selected.
 * @property max_values - The maximum number of options that can be selected.
 * @property disabled - A boolean indicating whether the select menu is disabled or not.
 * @property default_values - An array of default values for the select menu.
 * @property type - The type of the component, which is always `StringSelect`.
 */
export class StringSelect {
    type: ComponentType.StringSelect = ComponentType.StringSelect;
    id?: number;
    custom_id: string;

    options: StringSelectOption[];
    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;

    constructor(args: Omit<StringSelect, 'type'>) {
        this.type = ComponentType.StringSelect;
        this.custom_id = args.custom_id;
        this.options = args.options;
        this.placeholder = args.placeholder;
        this.min_values = args.min_values;
        this.max_values = args.max_values;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

export enum TextInputStyle {
    Short = 1,
    Paragraph = 2,
}
/**
 * Text Input is an interactive component that allows users to enter free-form text responses in modals.
 *
 * Text Inputs can only be used within modals and must be placed inside an `ActionRow`.
 *
 * @property id - An optional identifier for the text input.
 * @property custom_id - A unique identifier for the text input, used to identify which input was submitted.
 * @property style - The style of the text input, which determines its appearance and behavior.
 * @property label - The label displayed above the text input.
 * @property value - An optional default value for the text input.
 * @property placeholder - An optional placeholder text to display when the input is empty.
 * @property min_length - The minimum number of characters that can be entered.
 * @property max_length - The maximum number of characters that can be entered.
 * @property required - A boolean indicating whether the text input is required or not.
 */
export class TextInput {
    type: ComponentType.TextInput = ComponentType.TextInput;
    id?: number;
    custom_id: string;

    style: TextInputStyle;
    label: string;
    value?: string;
    placeholder?: string;
    min_length?: number;
    max_length?: number;
    required?: boolean;

    constructor(args: Omit<TextInput, 'type'>) {
        this.type = ComponentType.TextInput;
        this.custom_id = args.custom_id;
        this.style = args.style;
        this.label = args.label;
        this.value = args.value;
        this.placeholder = args.placeholder;
        this.min_length = args.min_length;
        this.max_length = args.max_length;
        this.required = args.required;
        this.id = args.id;
    }
}

export enum DefaultValueType {
    User = "user",
    Role = "role",
    Channel = "channel",
}

export class DefaultValue<T extends DefaultValueType> {
    id: number;
    type: T;

    constructor(args: DefaultValue<T>) {
        this.id = args.id;
        this.type = args.type;
    }
}

/**
 * A User Select is an interactive component that allows users to select one or more users in a message.
 * Options are automatically populated based on the server's available users.
 *
 * User Selects must be placed inside an Action Row and are only available in messages.
 * An Action Row can contain only one select menu and cannot contain buttons if it has a select menu.
 *
 * @property id - An optional identifier for the select menu.
 * @property custom_id - A unique identifier for the select menu, used to distinguish it from others in interaction responses.
 * @property placeholder - An optional placeholder text to display when no option is selected.
 * @property min_values - The minimum number of options that can be selected.
 * @property max_values - The maximum number of options that can be selected.
 * @property disabled - A boolean indicating whether the select menu is disabled or not.
 * @property default_values - An array of default values for the select menu.
 * @property type - The type of the component, which is always `UserSelect`.
 * @property default_values - An array of default values for the select menu.
 */
export class UserSelect {
    type: ComponentType.UserSelect = ComponentType.UserSelect;
    id?: number;
    custom_id: string;

    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
    default_values?: DefaultValue<DefaultValueType.User>[];

    constructor(args: Omit<UserSelect, 'type'>) {
        this.type = ComponentType.UserSelect;
        this.custom_id = args.custom_id;
        this.placeholder = args.placeholder;
        this.min_values = args.min_values;
        this.max_values = args.max_values;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

/**
 * A Role Select is an interactive component that allows users to select one or more roles in a message.
 * Options are automatically populated based on the server's available roles.
 *
 * Role Selects must be placed inside an Action Row and are only available in messages.
 * An Action Row can contain only one select menu and cannot contain buttons if it has a select menu.
 *
 * @property id - An optional identifier for the select menu.
 * @property custom_id - A unique identifier for the select menu, used to distinguish it from others in interaction responses.
 * @property placeholder - An optional placeholder text to display when no option is selected.
 * @property min_values - The minimum number of options that can be selected.
 * @property max_values - The maximum number of options that can be selected.
 * @property disabled - A boolean indicating whether the select menu is disabled or not.
 * @property default_values - An array of default values for the select menu.
 */
export class RoleSelect {
    type: ComponentType.RoleSelect = ComponentType.RoleSelect;
    id?: number;
    custom_id: string;

    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
    default_values?: DefaultValue<DefaultValueType.Role>[];

    constructor(args: Omit<RoleSelect, 'type'>) {
        this.type = ComponentType.RoleSelect;
        this.custom_id = args.custom_id;
        this.placeholder = args.placeholder;
        this.min_values = args.min_values;
        this.max_values = args.max_values;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

/**
 * A Mentionable Select is an interactive component that allows users to select one or more users or roles in a message.
 * Options are automatically populated based on the server's available users and roles.
 *
 * Mentionable Selects must be placed inside an Action Row and are only available in messages.
 * An Action Row can contain only one select menu and cannot contain buttons if it has a select menu.
 *
 * @property id - An optional identifier for the select menu.
 * @property custom_id - A unique identifier for the select menu, used to distinguish it from others in interaction responses.
 * @property placeholder - An optional placeholder text to display when no option is selected.
 * @property min_values - The minimum number of options that can be selected.
 * @property max_values - The maximum number of options that can be selected.
 * @property disabled - A boolean indicating whether the select menu is disabled or not.
 * @property default_values - An array of default values for the select menu.
 */
export class MentionableSelect {
    type: ComponentType.MentionableSelect = ComponentType.MentionableSelect;
    id?: number;
    custom_id: string;

    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
    default_values?: DefaultValue<DefaultValueType.User | DefaultValueType.Role>[];

    constructor(args: Omit<MentionableSelect, 'type'>) {
        this.type = ComponentType.MentionableSelect;
        this.custom_id = args.custom_id;
        this.placeholder = args.placeholder;
        this.min_values = args.min_values;
        this.max_values = args.max_values;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

/**
 * A Channel Select is an interactive component that allows users to select one or more channels in a message.
 * Options are automatically populated based on the server's available channels.
 *
 * Channel Selects must be placed inside an Action Row and are only available in messages.
 * An Action Row can contain only one select menu and cannot contain buttons if it has a select menu.
 *
 * @property id - An optional identifier for the select menu.
 * @property custom_id - A unique identifier for the select menu, used to distinguish it from others in interaction responses.
 * @property placeholder - An optional placeholder text to display when no option is selected.
 * @property channel_types - An array of channel types to filter the selectable channels.
 * @property min_values - The minimum number of options that can be selected.
 * @property max_values - The maximum number of options that can be selected.
 * @property disabled - A boolean indicating whether the select menu is disabled or not.
 * @property default_values - An array of default values for the select menu.
 */
export class ChannelSelect {
    type: ComponentType.ChannelSelect = ComponentType.ChannelSelect;
    id?: number;
    custom_id: string;

    placeholder?: string;
    channel_types?: ChannelType[];
    min_values?: number;
    max_values?: number;
    disabled?: boolean;
    default_values?: DefaultValue<DefaultValueType.Channel>[];

    constructor(args: Omit<ChannelSelect, 'type'>) {
        this.type = ComponentType.ChannelSelect;
        this.custom_id = args.custom_id;
        this.placeholder = args.placeholder;
        this.channel_types = args.channel_types;
        this.min_values = args.min_values;
        this.max_values = args.max_values;
        this.disabled = args.disabled;
        this.id = args.id;
    }
}

/**
 * A Section is a top-level layout component that allows you to join text contextually with an accessory.
 *
 * Sections are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the section.
 * @property components - An array of `TextDisplay` components to be displayed in the section.
 * @property accessory - An optional accessory component, such as a `Button` or `Thumbnail`, to be displayed alongside the text.
 */
export class Section { // REQUIRES THE IS_COMPONENTS_V2 MESSAGE FLAG
    type: ComponentType.Section = ComponentType.Section;
    id?: number;

    components: TextDisplay[];
    accessory: Button<any> | Thumbnail;

    constructor(args: Omit<Section, 'type'>) {
        this.type = ComponentType.Section;
        this.components = args.components;
        this.accessory = args.accessory;
        this.id = args.id;
    }
}

/**
 * A Text Display is a top-level content component that allows you to add text to your message formatted with markdown and mention users and roles.
 * This is similar to the content field of a message, but allows you to add multiple text components, controlling the layout of your message.
 *
 * Text Displays are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the text display.
 * @property content - The text content to be displayed, which can include markdown formatting and mentions.
 */
export class TextDisplay {
    type: ComponentType.TextDisplay = ComponentType.TextDisplay;
    id?: number;

    content: string;

    constructor(args: Omit<TextDisplay, 'type'>) {
        this.type = ComponentType.TextDisplay;
        this.content = args.content;
        this.id = args.id;
    }
}

interface UnfurledMediaItem {
    url: string
}

/**
 * A Thumbnail is a content component that is a small image only usable as an accessory in a section
 * .
 * Thumbnails are only available in messages as an accessory in a section.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the thumbnail.
 * @property url - The media item to be displayed as a thumbnail, which must be a valid URL.
 * @property description - An optional description for the thumbnail.
 * @property spoiler - A boolean indicating whether the thumbnail is marked as a spoiler or not.
 */
export class Thumbnail {
    type: ComponentType.Thumbnail = ComponentType.Thumbnail;
    id?: number;

    media: UnfurledMediaItem;
    description?: string;
    spoiler?: boolean;

    constructor(args: Omit<Omit<Thumbnail, 'type'>, 'media'> & { url: string }) {
        this.type = ComponentType.Thumbnail;
        this.media = { url: args.url };
        this.description = args.description;
        this.spoiler = args.spoiler;
        this.id = args.id;
    }
}

interface MediaGalleryItem {
    media: UnfurledMediaItem;
    description?: string;
    spoiler?: boolean;
}

/**
 * A Media Gallery is a top-level content component that allows you to display 1-10 media attachments in an organized gallery format.
 * Each item can have optional descriptions and can be marked as spoilers.
 *
 * Media Galleries are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the media gallery.
 * @property items - An array of `MediaGalleryItem`s to be displayed in the gallery.
 * @property media - An array of media items to be displayed in the gallery, which must be valid URLs.
 * @property description - An optional description for the media item.
 * @property spoiler - A boolean indicating whether the media item is marked as a spoiler or not.
 */
export class MediaGallery {
    type: ComponentType.MediaGallery = ComponentType.MediaGallery;
    id?: number;

    items: MediaGalleryItem[];

    constructor(args: Omit<MediaGallery, 'type' | 'items'> & { media: Thumbnail[] }) {
        this.type = ComponentType.MediaGallery;
        this.items = args.media.map((thumbnail) => ({
            media: thumbnail.media,
            description: thumbnail.description,
            spoiler: thumbnail.spoiler,
        }));
        this.id = args.id;
    }
}

/**
 * A File is a top-level component that allows you to display an uploaded file as an attachment to the message and reference it in the component.
 * Files are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the file component.
 * @property file - The url for the file must use the attachment:// syntax.
 *      This means adding the attachment as an actual attachment to the message, and then writing attachment://<filename> in this field.
 * @property spoiler - A boolean indicating whether the file is marked as a spoiler or not.
 */
export class File {
    type: ComponentType.File = ComponentType.File;
    id?: number;

    file: UnfurledMediaItem; // only supports attachment:// syntax
    spoiler?: boolean;

    constructor(args: Omit<Omit<File, 'type'>, 'file'> & { file: string }) {
        this.type = ComponentType.File;
        this.file = { url: args.file };
        this.spoiler = args.spoiler;
        this.id = args.id;
    }
}

export enum SeparatorSpacing {
    Small = 1,
    Large = 2,
}

/**
 * A Separator is a top-level layout component that adds vertical padding and visual division between other components.
 *
 * Separators are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the separator.
 * @property divider - A boolean indicating whether the separator should display a visual divider or not.
 * @property spacing - The spacing type of the separator, which can be either small or large.
 */
export class Separator {
    type: ComponentType.Separator = ComponentType.Separator;
    id?: number;

    divider?: boolean;
    spacing?: SeparatorSpacing;

    constructor(args?: Omit<Separator, 'type'>) {
        this.type = ComponentType.Separator;
        if (!args) return this;
        this.divider = args.divider;
        this.spacing = args.spacing;
        this.id = args.id;
    }
}

/**
 * A Container is a top-level layout component that holds up to 40 components. There is no actual limit on the number of components, but messages are limited to 40 components, which effectively limits the number of components in a container to 40.
 * Containers are visually distinct from surrounding components and have an optional customizable color bar.
 *
 * Containers are only available in messages.
 *
 * **TO USE THIS COMPONENT, YOU MUST ENABLE THE `IS_COMPONENTS_V2` MESSAGE FLAG.**
 *
 * @property id - An optional identifier for the container.
 * @property components - An array of components to be displayed in the container.
 * @property accent_color - An optional hex color value for the container's accent color.
 * @property spoiler - A boolean indicating whether the container is marked as a spoiler or not.
 */
export class Container {
    type: ComponentType.Container = ComponentType.Container;
    id?: number;

    components: ContainerComponent[];
    accent_color?: string; // Must be a hex value
    spoiler?: boolean;

    constructor(args: Omit<Container, 'type'>) {
        this.type = ComponentType.Container;
        this.components = args.components;
        this.id = args.id;
    }
}