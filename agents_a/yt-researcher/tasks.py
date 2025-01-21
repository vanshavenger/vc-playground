from crewai import Task # type: ignore
from tools import tool
from yt_researcher import blog_resarcher, blog_writer

research_task = Task(
    description=(
        "Identify the video {topic}."
        "Get detialed information about the video from the channel."
    ),
    expected_output='A comprehensive 3 paragraph long report based on the {topic} of video content.',
    tools=[tool],
    agents=blog_resarcher,    
)

write_task = Task(
    description=(
        "get the info from the youtube channel on the topic {topic}."
    ),
    expected_output="Summarize the info from the youtube channel video on the topic {topic}.",
    tools=[tool],
    agents=blog_writer,
    async_execution=False,
    output_file='blog_post.md',
)