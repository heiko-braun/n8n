import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

/**
 * Adds workflow metadata tags to the request body.
 * This enables per-workflow tracking in LLM provider dashboards.
 *
 * @param context - The execution context (IExecuteFunctions or ILoadOptionsFunctions)
 * @param body - The request body to modify
 * @returns Modified body with workflow ID in metadata tags
 */
export function addWorkflowMetadata(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	body: IDataObject | string | undefined,
): IDataObject | string | undefined {
	if (!body || typeof body !== 'object') {
		return body;
	}

	// Create a copy of the body using conservative approach
	const modifiedBody = Object.assign({}, body) as IDataObject;

	// Get workflow ID dynamically
	const workflowId = context.getWorkflow().id;

	// Add metadata field with workflow ID
	modifiedBody.metadata = {
		tags: [`workflow-${workflowId}`],
	};

	return modifiedBody;
}
