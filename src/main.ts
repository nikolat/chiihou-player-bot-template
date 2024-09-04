import type { EventTemplate, VerifiedEvent } from 'nostr-tools/pure';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';
import * as nip19 from 'nostr-tools/nip19';
import WebSocket from 'ws';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  getPlayerSignerMap,
  mahjongChannelId,
  mahjongServerPubkey,
  relayUrls,
} from './config.js';
import { getResponseEvent } from './response.js';
useWebSocketImplementation(WebSocket);

const main = async () => {
  const signerMap = getPlayerSignerMap();
  const pool = new SimplePool();
  const h = pool.subscribeMany(
    relayUrls,
    [
      {
        kinds: [42],
        '#p': Array.from(signerMap.keys()),
        '#e': [mahjongChannelId],
        since: Math.floor(Date.now() / 1000),
      },
    ],
    {
      async onevent(event) {
        const responseEvents: VerifiedEvent[] = [];
        const targetPubkeys = new Set(
          event.tags
            .filter(
              (tag) =>
                tag.length >= 2 && tag[0] === 'p' && signerMap.has(tag[1]),
            )
            .map((tag) => tag[1]),
        );
        for (const pubkey of targetPubkeys) {
          let rs: VerifiedEvent | null;
          try {
            rs = await getResponseEvent(event, signerMap.get(pubkey)!);
          } catch (error) {
            console.error(error);
            return;
          }
          if (rs !== null) {
            responseEvents.push(rs);
          }
        }
        //出力
        for (const responseEvent of responseEvents) {
          while (Math.floor(Date.now() / 1000) < responseEvent.created_at) {
            await sleep(200);
          }
          Promise.any(pool.publish(relayUrls, responseEvent));
        }
      },
      oneose() {
        //h.close()
      },
    },
  );

  //gamestart + join x 3
  let i = 0;
  for (const signer of getPlayerSignerMap().values()) {
    let command: string;
    if (i === 0) {
      command = 'gamestart';
    } else {
      command = 'join';
    }
    const templateEvent: EventTemplate = {
      kind: 42,
      tags: [
        ['e', mahjongChannelId, '', 'root'],
        ['p', mahjongServerPubkey],
      ],
      content: `nostr:${nip19.npubEncode(mahjongServerPubkey)} ${command}`,
      created_at: Math.floor(Date.now() / 1000),
    };
    await Promise.any(
      pool.publish(relayUrls, signer.finishEvent(templateEvent)),
    );
    i++;
    await sleep(1000);
  }
};

main();
