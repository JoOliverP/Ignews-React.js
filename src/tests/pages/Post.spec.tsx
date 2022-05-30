import { render, screen } from '@testing-library/react'
import Post, { getServerSideProps } from '../../pages/posts/[slug]';
import { getSession } from 'next-auth/client';
import { getPrismicClient } from '../../services/prismic';
import { stripe } from '../../services/stripe';
import { mocked } from 'jest-mock';



const post = { 
   slug: 'my-new-post', 
   title: 'My new post', 
   content: 'Post excerpt',
   updatedAt: 'January, 01'
}

jest.mock('next-auth/client');
jest.mock('../../services/prismic');

describe('Post page', () => {
   it('renders correctly', () => {
      render(<Post post={post}/>)

      expect(screen.getByText('My New Post')).toBeInTheDocument();
      expect(screen.getByText('Post excerpt')).toBeInTheDocument();
   })

   it('redirects user if no subscription is found', async () => {
      const getSessionMocked = mocked(getSession)

      getSessionMocked.mockReturnValueOnce(null)
      
      const response = await getServerSideProps({ params: { slug: 'my-new-post'}} as any)

      expect(response).toEqual(
         expect.objectContaining({
           redirect: expect.objectContaining({
                  destination: '/',   
              })
         })
      )
   })

   it ('loads initial data', async () => {
      const getSessionMocked = mocked(getSession)
      const getPrismicClientMocked = mocked(getPrismicClient);
      getPrismicClientMocked.mockReturnValueOnce({
         getByUID: jest.fn().mockResolvedValueOnce({
            data: {
               title: [
                  { type: 'heading', text: 'My new post'}
               ],
               content: [
                  { type: 'paragraph', text: 'Post content'}
               ],
            },
            last_publication_date: '01-01-2022'
         })
      } as any)

      getSessionMocked.mockReturnValueOnce({
         activeSubscription: 'fake-active-subscription',
      } as any)

      const response = await getServerSideProps({ params: { slug: 'my-new-post'}} as any)

      expect(response).toEqual(
         expect.objectContaining({
            props: {
               post: {
                  slug: 'my-new-post',
                  title: 'My new post',
                  content: 'Post content',
                  updatedAt: '01 de janeiro de 2022'
               }
            }
         })
      )


   })
})