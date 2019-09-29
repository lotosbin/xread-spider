import ApolloClient from "apollo-boost";
import config from "../config";

const client = new ApolloClient({
    uri: config.endpoint
});
export default client;
