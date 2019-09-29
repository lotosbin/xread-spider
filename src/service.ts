import request from "request";
import moment from "moment";
import client from "./apollo/client";
import gql from "graphql-tag"
import config from "./config";

function esc(s = "") {
    return s.replace(/"/g, "\\\"").replace(/[\r\n]/, "");
}

export async function list() {
    let result = await client.query<any>({
        query: gql`
            query Feeds{
                feeds(last:1000){
                    edges{
                        node{
                            id
                            link
                            title
                        }
                    }
                }
            }
        `
    });
    return result.data.feeds.edges.map((it: { node: any; }) => it.node)
}

export async function add({link, title, time, summary, feedId}: any) {
    console.log(`add ${JSON.stringify({link, title, time, feedId})}`);
    let result = await client.mutate({
        mutation: gql`mutation($title:String,$summary:String,$link:String,$time:String,$feedId:String){
            addArticle(title:$title,summary:$summary,link:$link,time:$time,feedId:$feedId ){
                id
            }
        }`,
        variables: {
            title,
            link,
            summary,
            feedId,
            time: time || moment().toString()
        }
    });
    console.log(JSON.stringify(result.errors))
}

export function add0({link, title, id, time, summary, feedId}: any) {
    let url = config.endpoint;
    request({
        url: url,
        method: 'POST',
        json: {
            query: `
                    mutation{
                        addArticle(title:"${esc(title)}",summary:"${esc(summary)}",link:"${link}",time:"${time || moment().toString()}"){
                                id
                        }
                    }
                    `
        }
    }, (error: { message: any; }, response: any, body: any) => {
        if (error) {
            console.error(error.message);
            return;
        }
        console.info('post success');
        console.log(body)
    })
}
