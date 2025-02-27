export interface User
{
	id: number;
	login: string;
	_2fa: {
		secret :string;
		enabled: boolean;
	};
}
