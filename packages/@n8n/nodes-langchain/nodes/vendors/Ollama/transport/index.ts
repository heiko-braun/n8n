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
		// Create a copy of the body using conservative approach
		modifiedBody = Object.assign({}, body) as IDataObject;

		// Get workflow ID dynamically
		const workflowId = this.getWorkflow().id;

		// Add metadata field with workflow ID
		(modifiedBody as IDataObject).metadata = {
			tags: [`workflow-${workflowId}`],
		};
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
