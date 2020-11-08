import serializeJavascript from "serialize-javascript";

export function serialize(input: any) {
    return serializeJavascript(input);
}

export function deserialize(input: string) {
    return eval("(" + input + ")");
}