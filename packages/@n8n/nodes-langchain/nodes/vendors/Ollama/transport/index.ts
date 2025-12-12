import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

import { addWorkflowMetadata } from '../helpers';

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

	// Add workflow metadata to request body for chat completions
	let modifiedBody = body;
	if (endpoint.includes('/chat') || endpoint.includes('/generate')) {
		modifiedBody = addWorkflowMetadata(this, body);
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
