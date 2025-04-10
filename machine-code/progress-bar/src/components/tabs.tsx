import { useState } from 'react'

interface DataType {
  name: string
  age: string
  email: string
  interests: string[]
  theme: string
}

interface ComponentProps {
  data: DataType
  setData: React.Dispatch<React.SetStateAction<DataType>>
}

const Setting = ({ data, setData }: ComponentProps) => {
  const themes = ['light', 'dark', 'system']

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData((prev) => ({
      ...prev,
      theme: e.target.value,
    }))
  }

  return (
    <div>
      <h3>Settings</h3>
      <div>
        <label htmlFor='theme'>Theme: </label>
        <select id='theme' value={data.theme} onChange={handleThemeChange}>
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const Interest = ({ data, setData }: ComponentProps) => {
  const interests = ['coding', 'music', 'reading', 'gaming', 'sports']

  const handleInterestChange = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  return (
    <div>
      <h3>Select your interests:</h3>
      {interests.map((interest) => (
        <div key={interest}>
          <input
            type='checkbox'
            id={interest}
            checked={data.interests.includes(interest)}
            onChange={() => handleInterestChange(interest)}
          />
          <label htmlFor={interest}>{interest}</label>
        </div>
      ))}
    </div>
  )
}

const Profile = ({ data, setData }: ComponentProps) => {
  const { name, age, email } = data

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof DataType
  ) => {
    setData((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
  }

  return (
    <div>
      <div>
        <label>Name: </label>
        <input
          type='text'
          value={name}
          onChange={(e) => handleChange(e, 'name')}
        />
      </div>
      <div>
        <label>Age: </label>
        <input
          type='number'
          value={age}
          onChange={(e) => handleChange(e, 'age')}
        />
      </div>
      <div>
        <label>Email: </label>
        <input
          type='email'
          value={email}
          onChange={(e) => handleChange(e, 'email')}
        />
      </div>
    </div>
  )
}

const Tabs = () => {
  const [errors, setErrors] = useState({})
  const [data, setData] = useState({
    name: 'Vansh',
    age: '29',
    email: 'vanshchopra101@gmail.com',
    interests: ['coding', 'music'],
    theme: 'dark',
  })

  const [comp, setComp] = useState(0)
  const tabsConfig = [
    {
      name: 'Profile',
      component: Profile,
    },
    {
      name: 'Interest',
      component: Interest,
    },
    {
      name: 'Settings',
      component: Setting,
    },
  ]

  const onclick = (id: number) => {
    setComp(id)
  }

  const ActiveTab = tabsConfig[comp].component

  return (
    <div className='tab-container'>
      <div className='tab-heading-container'>
        {tabsConfig.map((tab, index) => (
          <div
            key={tab.name}
            className={`tab-heading ${comp === index ? 'active' : ''}`}
            onClick={() => onclick(index)}
          >
            {tab.name}
          </div>
        ))}
      </div>

      <div className='tab-body'>
        <ActiveTab data={data} setData={setData} />
      </div>

      <button
        onClick={() => {
          setComp((prev) => (prev === 0 ? tabsConfig.length - 1 : prev - 1))
        }}
      >
        Prev
      </button>

      <button
        onClick={() => {
          setComp((prev) => (prev === tabsConfig.length - 1 ? 0 : prev + 1))
        }}
      >
        Next
      </button>
      {comp === tabsConfig.length - 1 && <button type='submit'>Submit</button>}
    </div>
  )
}

export default Tabs
