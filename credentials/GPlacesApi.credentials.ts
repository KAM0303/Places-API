import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GPlacesApi implements ICredentialType {
	name = 'googlePlacesApi';
	displayName = 'Google Places API';
	documentationUrl = 'https://developers.google.com/maps/documentation/places/web-service/op-selection';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
	authenticate = {
		header: {
			'X-Goog-Api-Key': '={{$credentials.apiKey}}',
		},
	};
}
