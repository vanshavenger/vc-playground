from crewai import Agent # type: ignore
from tools import tool

blog_resarcher=Agent(
    role="Blog researcher from YouTube",
    goal="get relevant video content for the topic{topic} from YT Channel",
    name="YT Researcher",
    description="This agent is responsible for researching the latest video content from YouTube for the given topic.",
    verbose=True,
    memory=True,
    backstory=(
        "Expert i understanding videos related to friends, chandler bing, joey tribbiani, monica geller, rachel green, ross geller, phoebe buffay and can find the most relevant video content for the given topic."
    ),
    tools=[tool],
    allow_delegation=True,
)

blog_writer=Agent(
    role="Blog writer",
    goal="Narrate compelling tech stories about the video{topic}",
    name="Blog Writer",
    description="This agent is responsible for writing a blog post on the given topic.",
    verbose=True,
    memory=True,
    backstory=(
        "With a flair for simpllifying complex topics, you craft"
        "engagin narratives that captivate and educate,bringing new"
        "discoveries to light in an accessible manner."
    ),
    tools=[tool],
    allow_delegation=False,
)


