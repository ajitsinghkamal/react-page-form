//#region imports
import { useCallback } from 'react';
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

import { FORM_QUESTIONS, PERSIST_KEY } from './constants';
import css from './questionaire.module.scss';
import { ReactComponent as Search } from 'src/assets/illustrations/search.svg';

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
			localStorage.removeItem(PERSIST_KEY);
		} catch (e) {
			dispatchRecom({
				type: 'update',
				payload: {
					error: e,
				},
			});
		}
	};
	const submitQuestionaire = async (
		allResponses: PagedFormState['questionFlow']
	) => {
		try {
			dispatchToken({
				type: 'fetch',
			});
			const { jwt } = await PostChallenge(
				preparePayloadForToken(allResponses)
			);
			dispatchToken({
				type: 'update',
				payload: { response: jwt },
			});
			fetchRecommendations(jwt);
		} catch (e) {
			dispatchToken({
				type: 'update',
				payload: { error: e.response.errors },
			});
		}
	};

	/**
	 * Exit recommendations and start a fresh new form
	 */
	const shouldRestartForm = useCallback(() => {
		localStorage.removeItem(PERSIST_KEY);
		dispatchRecom({
			type: 'reset',
		});
		dispatchToken({
			type: 'reset',
		});
	}, []);

	/**
	 * clear all form errors
	 *
	 * required if form is cleared
	 */
	const shouldResetForm = useCallback(() => {
		dispatchToken({
			type: 'reset',
		});
	}, []);

	return (
		<>
			<Seo />
			<main className={cx(css.questionaire, 'clear')}>
				{recommendations.status &&
				['DONE', 'WAITING'].includes(recommendations.status) ? (
					<Recommendations
						list={recommendations.response}
						loading={recommendations.status === 'WAITING'}
						onReset={shouldRestartForm}
					/>
				) : (
					<PagedForm
						title={
							<>
								<Search
									className={css.questionaire_title_icon}
								/>
								Find my Plan
							</>
						}
						persistData={PERSIST_KEY}
						questions={formQuestions}
						onFormSubmit={submitQuestionaire}
						onFormReset={shouldResetForm}
						errors={challengeToken.error}
						isSubmitting={challengeToken.status === 'WAITING'}
					/>
				)}
			</main>
		</>
	);
}

export default Questionaire;
