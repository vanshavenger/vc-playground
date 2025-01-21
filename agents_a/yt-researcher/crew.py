from crewai import Crew, Process # type: ignore
from yt_researcher import blog_resarcher, blog_writer
from tasks  import research_task, write_task

crew = Crew(
  agents=[blog_resarcher, blog_writer],
  tasks=[research_task, write_task],
  process=Process.sequential, 
  memory=True,
  cache=True,
  max_rpm=100,
  share_crew=True
)

result=crew.kickoff(inputs={'topic':'Chandler Bing'})
print(result)