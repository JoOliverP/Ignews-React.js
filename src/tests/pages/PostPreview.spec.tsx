import { render, screen } from '@testing-library/react'
import Post, { getStaticProps } from '../../pages/posts/preview/[slug]';
import { useSession } from 'next-auth/client';
import { getPrismicClient } from '../../services/prismic';
import { stripe } from '../../services/stripe';
import { mocked } from 'jest-mock';
import { useRouter } from 'next/router';



const post = { 
   slug: 'my-new-post', 
   title: 'My new post', 
   content: 'Post excerpt',
   updatedAt: 'January, 01'
}

jest.mock('next-auth/client');
jest.mock('next/router');
jest.mock('../../services/prismic');

describe('Post preview page', () => {
   it('renders correctly', () => {
      const useSessionMocked = mocked(useSession)

      useSessionMocked.mockReturnValueOnce([null, false])

      render(<Post post={post}/>)

      expect(screen.getByText('My New Post')).toBeInTheDocument();
      expect(screen.getByText('Post excerpt')).toBeInTheDocument();
      expect(screen.getByText('Wanna continue reading ?')).toBeInTheDocument()
   })
   
   it('redirects user to full post when use is subscribed   ', async () => {
      const useSessionMocked = mocked(useSession)
      const useRouterMocked = mocked(useRouter)
      const pushMock = jest.fn()

      useSessionMocked.mockReturnValueOnce([
         { activeSubscription: 'fake-active-subscription'},
         false
      ] as any)

      useRouterMocked.mockReturnValueOnce({
         push: pushMock,
      } as any)

      render(<Post post={post}/>)

      expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post')
   })

   it ('loads initial data', async () => {
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


      const response = await getStaticProps({ params: { slug: 'my-new-post'} })

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