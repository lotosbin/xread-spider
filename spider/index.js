// @flow
import 'cross-fetch/polyfill';
import Parser from "rss-parser";
import {add, list} from "./service";
import _ from 'lodash';

class Queue<T> {
    queue: Array<T> = [];

    enqueueAll(feeds: [T]) {
        feeds.forEach(it => this.enqueue(it))
    }

    enqueue(feed: T) {
        if (_.find(this.queue, (it) => it.id === feed.id)) return;
        this.queue.unshift(feed)
    }

    dequeue() {
        return this.queue.pop()
    }
}
const parser = new Parser();

class IArticle {
}

type TFeed = {
    id: string
}
const queue = new Queue<TFeed>();
export async function runTask(feedLink, feedId) {
    try {
        const articles = await fetchFeed({}, feedLink);
        articles.forEach(article => add({...article, feedId}));
    } catch (e) {
        console.error(e)
    }
}

export async function fetchFeed({openid, unionid, first, after, last, before}, feedUrl): Promise<[IArticle]> {
    console.log(`getArticles3`);
    const feed = await parser.parseURL(feedUrl);
    return feed.items.map((it) => ({
        id: it.guid,
        link: it.link,
        summary: it.content,
        tags: (it.categories || []).map((category) => ({id: "", name: category})),
        time: it.pubDate,
        title: it.title,
    }));
}

const cron = require('node-cron');
let running = false;
let run = async function () {
    try {
        console.log(`${Date().toString()}:running dispatcher`);
        if (running) return;
        const feeds = await list();
        queue.enqueueAll(feeds);
        console.info(`queue:${JSON.stringify(queue.queue)}`)
    } catch (e) {
        console.error(`dispatcher:`, e)
    }
};

async function handle() {
    try {
        console.log(`${Date().toString()}:running handler`);
        const feed = queue.dequeue();
        if (feed) {
            console.log(`run:${feed.id},${feed.link}`);
            runTask(feed.link, feed.id).catch(error => console.log(error))
        }
    } catch (e) {
        console.error(`handler:`, e)
    }
}

(async function () {
    await run();
    await handle()
})();

const dispatcher = cron.schedule('0 0 */1 * * * ', () => {
    run().catch(error => console.error(`dispatcher:`, error))
}, {scheduled: true});
const handler = cron.schedule('0 */1 * * * * ', () => {
    handle().catch(error => console.error(`handler:`, error))
}, {scheduled: true});
process.on('SIGINT', function () {
    console.log('Exit now!');
    dispatcher.destroy();
    handler.destroy();
    process.exit();
});