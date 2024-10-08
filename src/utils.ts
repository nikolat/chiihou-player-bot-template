import { type EventTemplate, type NostrEvent, finalizeEvent, getPublicKey } from 'nostr-tools/pure';

export class Signer {
  #seckey: Uint8Array;

  constructor(seckey: Uint8Array) {
    this.#seckey = seckey;
  }

  getPublicKey = () => {
    return getPublicKey(this.#seckey);
  };

  finishEvent = (unsignedEvent: EventTemplate) => {
    return finalizeEvent(unsignedEvent, this.#seckey);
  };
}

export const getTagsAirrep = (event: NostrEvent): string[][] => {
  if (event.kind === 1) {
    return [['e', event.id, '', 'mention']];
  } else if (event.kind === 42) {
    const tagRoot = event.tags.find((tag) => tag.length >= 4 && tag[0] === 'e' && tag[3] === 'root');
    if (tagRoot !== undefined) {
      return [tagRoot, ['e', event.id, '', 'mention']];
    } else {
      throw new TypeError('root is not found');
    }
  }
  throw new TypeError(`kind ${event.kind} is not supported`);
};

export const getTagsReply = (event: NostrEvent): string[][] => {
  const tagsReply: string[][] = [];
  const tagRoot = event.tags.find((tag) => tag.length >= 4 && tag[0] === 'e' && tag[3] === 'root');
  if (tagRoot !== undefined) {
    tagsReply.push(tagRoot);
    tagsReply.push(['e', event.id, '', 'reply']);
  } else {
    tagsReply.push(['e', event.id, '', 'root']);
  }
  for (const tag of event.tags.filter((tag) => tag.length >= 2 && tag[0] === 'p' && tag[1] !== event.pubkey)) {
    tagsReply.push(tag);
  }
  tagsReply.push(['p', event.pubkey, '']);
  return tagsReply;
};
