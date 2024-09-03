import type {
  EventTemplate,
  NostrEvent,
  VerifiedEvent,
} from 'nostr-tools/pure';
import { getTagsReply, Signer } from './utils.js';

export const getResponseEvent = async (
  event: NostrEvent,
  signer: Signer,
): Promise<VerifiedEvent | null> => {
  if (event.pubkey === signer.getPublicKey()) {
    //自分自身の投稿には反応しない
    return null;
  }
  const res = await selectResponse(event);
  if (res === null) {
    return null;
  }
  return signer.finishEvent(res);
};

let tsumo: string;

const selectResponse = async (
  event: NostrEvent,
): Promise<EventTemplate | null> => {
  let content: string;
  const m = event.content.match(
    /NOTIFY\s(\S+)\s?(\S+)?\s?(\S+)?\s?(\S+)?\s?(\S+)?/,
  );
  if (m !== null) {
    const command = m[1];
    switch (command) {
      case 'gamestart':
        break;
      case 'kyokustart':
        break;
      case 'point':
        break;
      case 'haipai':
        break;
      case 'dora':
        break;
      case 'tsumo':
        tsumo = m[4];
        break;
      case 'sutehai':
        break;
      case 'say':
        break;
      case 'open':
        break;
      case 'agari':
        break;
      case 'ryukyoku':
        break;
      case 'kyokuend':
        break;
      case 'gameend':
        break;
      default:
        break;
    }
    return null;
  } else if (/GET\ssutehai\?$/s.test(event.content)) {
    content = `sutehai? sutehai ${tsumo}`;
  } else if (
    /GET\snaku\?\s(((ron|kan|pon|chi)\s)*(ron|kan|pon|chi))$/s.test(
      event.content,
    )
  ) {
    content = 'naku? no';
  } else {
    return null;
  }
  const templateEvent: EventTemplate = {
    kind: event.kind,
    tags: getTagsReply(event),
    content,
    created_at: event.created_at + 1,
  };
  return templateEvent;
};
