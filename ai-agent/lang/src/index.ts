import { model } from './llm'
import { tools, toolsByName } from './tools'
import { ToolMessage, BaseMessage } from '@langchain/core/messages'
import { MessagesAnnotation, StateGraph } from '@langchain/langgraph'

const llmCall = async (state: typeof MessagesAnnotation.State) => {
	const modelWithTools = model.bindTools(tools)
	const result = await modelWithTools.invoke([
		{
			role: 'system',
			content:
				'You are a helpful assitant tasked with performing arithmetic operations on set of numbers.',
		},
		...state.messages,
	])

	return {
		messages: [result],
	}
}

async function toolNode(state: typeof MessagesAnnotation.State) {
	const results: ToolMessage[] = []
	interface ExtendedMessage extends BaseMessage {
		tool_calls?: { name: string; args: any; id: string }[]
	}

	const lastMessage = state.messages.at(-1) as ExtendedMessage

	if (lastMessage?.tool_calls?.length) {
		for (const toolCall of lastMessage.tool_calls) {
			const tool = toolsByName[toolCall.name]
			const observation = await tool.invoke(toolCall.args)
			results.push(
				new ToolMessage({
					content: observation,
					tool_call_id: toolCall.id,
				})
			)
		}
	}

	return { messages: results }
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
	const messages = state.messages
	const lastMessage = messages.at(-1)

	// @ts-expect-error

	if (lastMessage?.tool_calls?.length) {
		return 'Action'
	}

	return '_end_'
}

const main = async () => {
	const agentBuilder = new StateGraph(MessagesAnnotation)
		.addNode('llmCall', llmCall)
		.addNode('tools', toolNode)
		.addEdge('__start__', 'llmCall')
		.addConditionalEdges('llmCall', shouldContinue, {
			Action: 'tools',
			_end: '__end__',
		})
		.addEdge('tools', 'llmCall')
		.compile()

	const messages = [
		{
			role: 'user',
			content: 'Add 3 and 4 then subtssract 1 then add 54 then divide by 2 then multiply by 3 then do - 80 and do divide by 3 and give the reminder',
		},
	]
	const result = await agentBuilder.invoke({ messages })
	console.log(result.messages)
}

main()