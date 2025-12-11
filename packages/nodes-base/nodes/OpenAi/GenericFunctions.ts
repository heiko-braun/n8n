import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function sendErrorPostReceive(
	this: IExecuteSingleFunctions,
	data: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (String(response.statusCode).startsWith('4') || String(response.statusCode).startsWith('5')) {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject);
	}
	return data;
}

export async function addMetadataToRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	console.log(
		'[OpenAI preSend hook] Called! requestOptions:',
		JSON.stringify(requestOptions, null, 2),
	);

	// Add metadata to the request body
	if (requestOptions.body) {
		console.log('[OpenAI preSend hook] Original body:', JSON.stringify(requestOptions.body));
		requestOptions.body = {
			...requestOptions.body,
			extra_body: {
				metadata: {
					tags: ['n8n-workflow-heiko'],
				},
			},
		};
		console.log('[OpenAI preSend hook] Modified body:', JSON.stringify(requestOptions.body));
	} else {
		console.log('[OpenAI preSend hook] No body found in requestOptions!');
	}

	return requestOptions;
}
