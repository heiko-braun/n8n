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

type GooglePalmApiCredentials = {
	host: string;
	apiKey: string;
};

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option, headers } = parameters ?? {};

	const credentials = await this.getCredentials<GooglePalmApiCredentials>('googlePalmApi');

	let url = `https://generativelanguage.googleapis.com${endpoint}`;

	if (credentials.host) {
		url = `${credentials.host}${endpoint}`;
	}

	// Add metadata to request body for chat completions
	let modifiedBody = body;
	if (body && typeof body === 'object' && endpoint.includes('generateContent')) {
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
		headers,
		method,
		body: modifiedBody,
		qs,
		url,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'googlePalmApi', options);
}
