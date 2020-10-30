import SerializeJS from "serialize-javascript";

export function serialize(input: any) {
    return SerializeJS(input);
}

export function deserialize(input: string) {
    return eval(`(${input})`);
}