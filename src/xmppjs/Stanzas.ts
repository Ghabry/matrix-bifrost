import * as uuid from "uuid/v4";
import * as he from "he";
import { IBasicProtocolMessage } from "../MessageFormatter";

export interface IStza {
    type: string;
    xml: string;
}

export class StzaPresence implements IStza {
    constructor(
        public from: string,
        public to: string,
        public id?: string,
        public presenceType?: string,
    ) {
        this.id = this.id || uuid();
    }

    get xContent(): string { return ""; }

    get xProtocol(): string { return "muc"; }

    get presenceContent(): string { return ""; }

    get type(): string {
        return "presence";
    }

    get xml(): string {
        const type = this.presenceType ? ` type='${this.presenceType}'` : "";
        const id = this.id ? ` id='${this.id}'` : "";
        const content = this.xContent ? `<x xmlns='http://jabber.org/protocol/${this.xProtocol}'>${this.xContent}</x>` :
            "<x xmlns='http://jabber.org/protocol/muc'/>";
        return `<presence from='${this.from}' to='${this.to}'${id}${type}>${content}${this.presenceContent}</presence>`;
    }
}

export class StzaPresenceItem extends StzaPresence {
    constructor(
        from: string,
        to: string,
        id?: string,
        public affiliation: string = "member",
        public role: string = "participant",
        public self: boolean = false,
        public jid: string = "",
        public itemType: string = "",
    ) {
        super(from, to, id, itemType);
    }

    get xProtocol(): string { return "muc#user"; }

    public get xContent() {
        const statusCode = this.self ? "<status code='110'/>" : "";
        const jid = this.jid ? ` jid='${this.jid}'` : "";
        return `<item affiliation='${this.affiliation}'${jid} role='${this.role}'/>${statusCode}`;
    }
}

export class StzaPresenceError extends StzaPresence {
    constructor(
        from: string,
        to: string,
        id: string,
        public by: string,
        public errType: string,
        public innerError: string,

    ) {
        super(from, to, id, "error");
    }

    public get presenceContent() {
        return `<error type='${this.errType}' by='${this.by}'><${this.innerError}`
             + ` xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/></error>`;
    }
}

export class StzaPresenceJoin extends StzaPresence {
    constructor(
        public from: string,
        public to: string,
        public id?: string,
        public presenceType?: string,
    ) {
        super(from, to, id);
    }

    public get xContent() {
        // No history.
        // TODO: I'm sure we want to be able to configure this.
        return `<history maxchars='0'/>`;
    }
}

export class StzaMessage implements IStza {
    public html: string = "";
    public body: string = "";
    public attachments: string[] = [];
    public id;
    constructor(
        public from: string,
        public to: string,
        idOrMsg?: string|IBasicProtocolMessage,
        public messageType?: string,
    ) {
        if (idOrMsg && idOrMsg.hasOwnProperty("body")) {
            idOrMsg = idOrMsg as IBasicProtocolMessage;
            this.body = idOrMsg.body;
            if (idOrMsg.formatted) {
                const html = idOrMsg.formatted.find((f) => f.type === "html");
                this.html = html ? html.body : "";
            }
            if (idOrMsg.opts) {
                this.attachments = (idOrMsg.opts.attachments || []).map((a) => a.uri);
            }
            this.id = idOrMsg.id;
        } else if (idOrMsg) {
            this.id = idOrMsg;
        }
        this.id = this.id || uuid();
    }

    get type(): string {
        return "message";
    }

    get xml(): string {
        const type = this.messageType ? `type='${this.messageType}'` : "";
        const attachments = this.attachments.map((a) =>
            `<x xmlns='jabber:x:oob'><url>${he.encode(a)}</url></x>`,
        );
        return `<message from='${this.from}' to='${this.to}' id='${this.id}' ${type}>`
             + `${this.html}<body>${he.encode(this.body)}</body>${attachments}</message>`;
    }
}

export class StzaMessageSubject implements IStza {
    constructor(
        public from: string,
        public to: string,
        public id?: string,
        public subject: string = "",
    ) {
        this.id = this.id || uuid();
    }

    get content(): string { return ""; }

    get type(): string {
        return "message";
    }

    get xml(): string {
        return `<message from='${this.from}' to='${this.to}' id='${this.id}' type='groupchat'>`
             + `<subject>${this.subject}</subject></message>`;
    }
}

export class StzaIqPing implements IStza {
    constructor(
        public from: string,
        public to: string,
        public id: string,
    ) {
        this.id = this.id || uuid();
    }

    get type(): string {
        return "iq";
    }

    get xml(): string {
        return `<iq from='${this.from}' to='${this.to}' id='${this.id}' type='get'>
    <ping xmlns='urn:xmpp:ping'/>
</iq>`;
    }
}
