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
	uri?: string;
	option?: IDataObject;
};

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option } = parameters ?? {};

	const credentials = await this.getCredentials('openAiApi');

	let uri = `https://api.openai.com/v1${endpoint}`;
	let headers = parameters?.headers ?? {};
	if (credentials.url) {
		uri = `${credentials?.url}${endpoint}`;
	}

	if (
		credentials.header &&
		typeof credentials.headerName === 'string' &&
		credentials.headerName &&
		typeof credentials.headerValue === 'string'
	) {
		headers = {
			...headers,
			[credentials.headerName]: credentials.headerValue,
		};
	}

	// Add workflow metadata to request body for chat completions and responses
	let modifiedBody = body;
	if (endpoint.includes('/chat/completions') || endpoint.includes('/responses')) {
		modifiedBody = addWorkflowMetadata(this, body);
	}

	const options = {
		headers,
		method,
		body: modifiedBody,
		qs,
		uri,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	return await this.helpers.requestWithAuthentication.call(this, 'openAiApi', options);
}
