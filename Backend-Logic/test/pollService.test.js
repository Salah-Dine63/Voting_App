const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePollInput } = require('../services/pollService');

test('accepts polls with the minimum and maximum number of options', () => {
    const minimum = normalizePollInput({
        question: 'Choose one',
        options: ['First', 'Second']
    });
    const maximum = normalizePollInput({
        question: 'Choose one',
        options: ['One', 'Two', 'Three', 'Four', 'Five', 'Six']
    });

    assert.equal(minimum.options.length, 2);
    assert.equal(maximum.options.length, 6);
});

test('rejects missing questions and option counts outside the allowed range', () => {
    assert.throws(() => normalizePollInput({ options: ['One', 'Two'] }), /Question is required/);
    assert.throws(() => normalizePollInput(null), /must be an object/);
    assert.throws(() => normalizePollInput({ question: 'Pick', options: ['Only one'] }), /between 2 and 6/);
    assert.throws(() => normalizePollInput({
        question: 'Pick',
        options: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
    }), /between 2 and 6/);
});

test('trims values and rejects empty or duplicate options', () => {
    const poll = normalizePollInput({
        question: '  Pick one  ',
        description: '  Some context  ',
        options: ['  First  ', 'Second']
    });

    assert.equal(poll.question, 'Pick one');
    assert.equal(poll.description, 'Some context');
    assert.deepEqual(poll.options, ['First', 'Second']);
    assert.throws(() => normalizePollInput({
        question: 'Pick',
        options: ['Same', ' same ']
    }), /must be unique/);
});

test('requires a valid future closing time when one is provided', () => {
    assert.throws(() => normalizePollInput({
        question: 'Pick',
        options: ['One', 'Two'],
        ends_at: 'not-a-date'
    }), /valid future date/);
    assert.throws(() => normalizePollInput({
        question: 'Pick',
        options: ['One', 'Two'],
        ends_at: new Date(Date.now() - 60000).toISOString()
    }), /valid future date/);
});
