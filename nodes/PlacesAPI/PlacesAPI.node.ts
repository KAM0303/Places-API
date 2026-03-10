import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class PlacesAPI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Places API',
		name: 'googlePlacesApi',
		icon: 'file:googlePlaces.svg',
		group: ['transform'],
		version: 1,
		description: 'Search for places using the New Google Places API (v1)',
		defaults: {
			name: 'Google Places API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googlePlacesApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Place',
						value: 'place',
					},
				],
				default: 'place',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['place'],
					},
				},
				options: [
					{
						name: 'Text Search',
						value: 'textSearch',
						description: 'Search for places using a text query',
						action: 'Search for places using a text query',
					},
				],
				default: 'textSearch',
			},
			// --- Parameters for Text Search ---
			{
				displayName: 'Text Query',
				name: 'textQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['place'],
						operation: ['textSearch'],
					},
				},
				default: '',
				placeholder: 'e.g. Pizza in New York',
				description: 'The text string on which to search',
			},
			{
				displayName: 'Field Mask',
				name: 'fieldMask',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['place'],
						operation: ['textSearch'],
					},
				},
				default: 'places.id,places.displayName,places.formattedAddress',
				description: 'Comma-separated list of fields to return (e.g., places.id,places.displayName). Use * for all (not recommended for production).',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['place'],
						operation: ['textSearch'],
					},
				},
				options: [
					{
						displayName: 'Language Code',
						name: 'languageCode',
						type: 'string',
						default: '',
						placeholder: 'en',
						description: 'The language in which to return results',
					},
					{
						displayName: 'Max Result Count',
						name: 'maxResultCount',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 20,
						},
						default: 5,
						description: 'Maximum number of results to return (between 1 and 20)',
					},
					{
						displayName: 'Region Code',
						name: 'regionCode',
						type: 'string',
						default: '',
						placeholder: 'US',
						description: 'The Unicode country/region code (CLDR) of the location where the request is coming from',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'place' && operation === 'textSearch') {
					const textQuery = this.getNodeParameter('textQuery', i) as string;
					const fieldMask = this.getNodeParameter('fieldMask', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i);

					const body: any = {
						textQuery,
						...additionalFields,
					};

					const options = {
						method: 'POST',
						uri: `https://places.googleapis.com/v1/places:searchText`,
						body,
						headers: {
							'X-Goog-FieldMask': fieldMask,
						},
						json: true,
					};

					const responseData = await this.helpers.requestWithAuthentication.call(this, 'googlePlacesApi', options);
					
					// The API returns an object with a "places" array
					const places = responseData.places || [];
					
					for (const place of places) {
						returnData.push({ json: place, pairedItem: i });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
