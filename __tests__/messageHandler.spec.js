import DreamsMessageHandler from '../src/messageHandler';

const buildMessage = (event, requestId = '123', idToken = undefined) => ({
  data: JSON.stringify({ event, message: { requestId, idToken } })
});

describe('#constructor', () => {
  test('dreams api endpoint not provided', () => {
    const iframe = document.createElement('iframe');
    const throwable = () => {
      new DreamsMessageHandler(iframe, undefined, {}, '123')
    }
    expect(throwable).toThrow();
  });
});

describe('#onMessage', () => {
  describe("when message is unreadable", () => {
    test("behaves correctly", () => {
      const iframe = document.createElement('iframe');
      const handler = new DreamsMessageHandler(iframe, 'www.example.com/123', {});
      const spy = jest.spyOn(global.console, 'error');
      const message = "";
      handler.onMessage(message)
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("when message is not of expected type", () => {
    test("behaves correctly", () => {
      const iframe = document.createElement('iframe');
      const handler = new DreamsMessageHandler(iframe, 'www.example.com/123', {});
      const spy = jest.spyOn(global.console, 'warn');
      const message = { data: JSON.stringify({ foo: 'bar' }) };
      handler.onMessage(message)
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when message is of expected type', () => {
    let iframe;;
    let postMessageSpy;
    let onIdTokenDidExpire;
    let onAccountProvisionRequested;
    let onExitRequested;
    let onShare;
    let callbacks;

    beforeEach(() => {
      iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      postMessageSpy = jest.spyOn(iframe.contentWindow, 'postMessage');
      onIdTokenDidExpire = jest.fn(() => Promise.resolve("token"));
      onAccountProvisionRequested = jest.fn(() => Promise.resolve());
      onExitRequested = jest.fn(() => Promise.resolve());
      onShare = jest.fn(() => Promise.resolve());
      callbacks = { onAccountProvisionRequested, onIdTokenDidExpire, onExitRequested, onShare }
    });

    describe("onIdTokenDidExpire", () => {
      describe("when callback was passed", () => {
        describe("callback promise resolves", () => {
          test("behaves correctly", async () => {
            const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', callbacks);
            const message = buildMessage('onIdTokenDidExpire');

            await handler.onMessage(message);

            expect(onIdTokenDidExpire).toHaveBeenCalled();
            expect(onAccountProvisionRequested).not.toHaveBeenCalled();
            expect(postMessageSpy).toHaveBeenCalled();
          });
        });

        describe("callback promise rejects", () => {
          test("behaves correctly", async () => {
            onIdTokenDidExpire = jest.fn(() => Promise.reject("nope!"));
            const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', { ...callbacks, onIdTokenDidExpire });
            const message = buildMessage('onIdTokenDidExpire');
            const spy = jest.spyOn(global.console, 'error');

            await handler.onMessage(message);

            expect(onIdTokenDidExpire).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith('onIdTokenDidExpire error: ', 'nope!');
          });
        });
      });

      describe("when callback was not passed", () => {
        test("behaves correctly", async () => {
          const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', { ...callbacks, onIdTokenDidExpire: undefined });
          const message = buildMessage('onIdTokenDidExpire');

          await handler.onMessage(message);

          expect(onIdTokenDidExpire).not.toHaveBeenCalled();
          expect(onAccountProvisionRequested).not.toHaveBeenCalled();
          expect(postMessageSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe("onAccountProvisionRequested", () => {
      describe("callback promise fulfills", () => {
        test("behaves correctly", async () => {
          const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', callbacks);
          const message = buildMessage('onAccountProvisionRequested');

          await handler.onMessage(message);

          expect(onIdTokenDidExpire).not.toHaveBeenCalled();
          expect(postMessageSpy).toHaveBeenCalled();
        });
      })

      describe("callback promise rejects", () => {
        test("behaves correctly", async () => {
          onAccountProvisionRequested = jest.fn(() => Promise.reject("nope!"));
          const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', { ...callbacks, onAccountProvisionRequested });
          const message = buildMessage('onAccountProvisionRequested');
          const spy = jest.spyOn(global.console, 'error');

          await handler.onMessage(message);

          expect(onAccountProvisionRequested).toHaveBeenCalled();
          expect(spy).toHaveBeenCalledWith('onAccountProvisionRequested error: ', 'nope!');
        });
      });
    });

    describe("onExitRequested", () => {
      test("behaves correctly", async () => {
        const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', callbacks);
        const message = buildMessage('onExitRequested');

        await handler.onMessage(message);

        expect(onExitRequested).toHaveBeenCalled();
        expect(onIdTokenDidExpire).not.toHaveBeenCalled();
        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(onIdTokenDidExpire).not.toHaveBeenCalled();
      });
    });

    describe("onShare", () => {
      test("behaves correctly", async () => {
        const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/123', callbacks);
        const message = buildMessage('onShare');

        await handler.onMessage(message);

        expect(onShare).toHaveBeenCalled();
        expect(postMessageSpy).not.toHaveBeenCalled();
      });
    });
  });
});

describe('#listen', () => {
  test("adds proper event listener", () => {
    const iframe = document.createElement('iframe');
    const handler = new DreamsMessageHandler(iframe, '123', {});
    const spy = jest.spyOn(window, 'addEventListener');

    handler.listen();
    expect(spy).toHaveBeenCalled();
  });
});

describe('#navigateTo', () => {
  test("posts appropriate message", () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const handler = new DreamsMessageHandler(iframe, 'http://www.example.com/', {});
    const spy = jest.spyOn(iframe.contentWindow, 'postMessage');

    handler.navigateTo('/example-url');
    expect(spy).toHaveBeenCalled();
  });
});
