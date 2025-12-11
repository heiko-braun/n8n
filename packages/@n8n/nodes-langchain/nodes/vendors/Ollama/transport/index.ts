import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

type RequestParameters = {
	headers?: IDataObject;
	body?: IDataObject | string;
	qs?: IDataObject;
	option?: IDataObject;
};

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option } = parameters ?? {};

	const credentials = await this.getCredentials<{
		apiKey?: string;
		baseUrl: string;
	}>('ollamaApi');
	const apiKey = credentials.apiKey;
	if (apiKey !== undefined && typeof apiKey !== 'string') {
		throw new Error('API key must be a string');
	}

	const url = new URL(endpoint, credentials.baseUrl).toString();

	const headers = parameters?.headers ?? {};
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	// Add metadata to request body for chat completions
	let modifiedBody = body;
	if (
		body &&
		typeof body === 'object' &&
		(endpoint.includes('/chat') || endpoint.includes('/generate'))
	) {
		console.log('=== Ollama LangChain preSend: Adding metadata ===');
		console.log('Endpoint:', endpoint);
		console.log('Original body:', JSON.stringify(body, null, 2));

		// Create a copy of the body using conservative approach
		modifiedBody = Object.assign({}, body) as IDataObject;

		// Add metadata field
		(modifiedBody as IDataObject).metadata = {
			tags: ['n8n-workflow-heiko'],
		};

		console.log('Modified body:', JSON.stringify(modifiedBody, null, 2));
	}

	const options = {
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		method,
		body: modifiedBody,
		qs,
		url,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'ollamaApi', options);
}
