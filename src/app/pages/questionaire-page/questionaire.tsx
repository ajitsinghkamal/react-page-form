//#region imports
import cx from 'classnames';

import { Seo } from 'app/components';
import {
	PagedForm,
	PagedFormState,
	Recommendations,
	Question,
} from 'app/features';
import { useHttpState } from 'app/hooks';
import { GetRecommendation, PostChallenge } from 'app/apis/challenge';

import { FORM_QUESTIONS } from './constants';
import css from './questionaire.module.scss';

//#endregion

type Props = {
	formQuestions: Question[];
};
function Questionaire({ formQuestions = FORM_QUESTIONS }: Props) {
	const {
		responseState: challengeToken,
		dispatch: dispatchToken,
	} = useHttpState();
	const {
		responseState: recommendations,
		dispatch: dispatchRecom,
	} = useHttpState();

	const preparePayloadForToken = (
		allResponses: PagedFormState['questionFlow']
	) => ({
		firstName: String(allResponses.firstName),
		occupation: String(allResponses.occupation),
		email: String(allResponses.email),
		address: String(allResponses.address),
		numberOfChildren: Number(
			allResponses.numberOfChildren || allResponses.children
		),
	});

	const submitQuestionaire = async (
		allResponses: PagedFormState['questionFlow']
	) => {
		try {
			dispatchToken({
				type: 'fetch',
			});
			let jwtToken = challengeToken.response;
			if (!jwtToken) {
				const { jwt: jwtToken } = await PostChallenge(
					preparePayloadForToken(allResponses)
				);
				dispatchToken({
					type: 'update',
					payload: {
						response: jwtToken,
					},
				});
			}
			fetchRecommendations(jwtToken);
		} catch (e) {
			dispatchRecom({
				type: 'update',
				payload: {
					error: e,
				},
			});
		}
	};

	const fetchRecommendations = async (token: string) => {
		try {
			dispatchRecom({
				type: 'fetch',
			});
			const data = await GetRecommendation(token);
			dispatchRecom({
				type: 'update',
				payload: {
					response: data,
				},
			});
		} catch (e) {
			dispatchRecom({
				type: 'update',
				payload: {
					error: e,
				},
			});
		}
	};

	return (
		<>
			<Seo />
			<main className={cx(css.questionaire, 'clear')}>
				{recommendations.status &&
				['DONE', 'WAITING'].includes(recommendations.status) ? (
					<Recommendations
						list={recommendations.response}
						loading={recommendations.status === 'WAITING'}
					/>
				) : (
					<PagedForm
						title="Find my Plan"
						questions={formQuestions}
						onFormSubmit={submitQuestionaire}
						isSubmitting={challengeToken.status === 'WAITING'}
					/>
				)}
			</main>
		</>
	);
}

export default Questionaire;
